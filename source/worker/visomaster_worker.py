
import argparse
import base64
import hashlib
import json
import os
import queue
import shutil
import subprocess
import sys
import threading
import time
import traceback
import uuid
import weakref
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

IMAGE_EXT = {".jpg", ".jpeg", ".jpe", ".png", ".webp", ".tif", ".tiff", ".jp2", ".bmp"}
PREVIEW_NAME = "folder.jpg"
EMBEDDING_NAME = "embedding.json"
SESSION_IDLE_SECONDS = 3600

def log(*parts):
    print(time.strftime("%H:%M:%S"), *parts, flush=True)

class Btn:


    def __init__(self, value):
        self.value = value
    def isChecked(self):
        return self.value

class Runtime:


    def __init__(self, root):
        self.root = root
        self.app = os.path.join(root, "VisoMaster-Fusion")
        self.lock = threading.RLock()
        self.ready = False
        self.error = ""
        self.input_folder_override = ""



        self._gpu_q = queue.Queue()
        self._gpu_thread = threading.Thread(target=self._gpu_loop, name="gpu", daemon=True)
        self._gpu_thread.start()
    def _gpu_loop(self):
        while True:
            fn, done = self._gpu_q.get()
            try:
                done["result"] = fn()
            except BaseException as e:
                done["error"] = e
            done["event"].set()

    def gpu(self, fn):

        if threading.current_thread() is self._gpu_thread:
            return fn()
        done = {"event": threading.Event()}
        self._gpu_q.put((fn, done))
        done["event"].wait()
        if "error" in done:
            raise done["error"]
        return done.get("result")

    def load(self):
        try:
            self._load()
            self.ready = True
            log("runtime ready")
        except Exception as e:
            self.error = f"{type(e).__name__}: {e}"
            log("runtime failed:", self.error)
            traceback.print_exc()

    def _load(self):
        sys.path.insert(0, self.app)
        import numpy as np
        import torch


        import app.ui.widgets.actions.common_actions
        from app.processors import models_processor as mp_mod
        from app.processors.models_processor import ModelsProcessor
        from app.processors.workers.function_worker import FunctionWorker
        from app.helpers.miscellaneous import ParametersDict, DFMModelManager
        from app.ui.widgets.common_layout_data import COMMON_LAYOUT_DATA
        from app.ui.widgets.swapper_layout_data import SWAPPER_LAYOUT_DATA, MASK_SHOW_DEFAULT
        from app.ui.widgets.face_editor_layout_data import FACE_EDITOR_LAYOUT_DATA
        from app.ui.widgets.settings_layout_data import SETTINGS_LAYOUT_DATA
        from app.ui.widgets.denoiser_layout_data import DENOISER_LAYOUT_DATA
        from app.ui.widgets.widget_components import TargetFaceCardButton


        def _no_sidecar(self_mp, model_name, onnx_path):
            sidecar = onnx_path[: -len(".onnx")] + ".trtshape.onnx" if onnx_path.lower().endswith(".onnx") else ""
            return sidecar if sidecar and os.path.exists(sidecar) else onnx_path

        mp_mod.ModelsProcessor._ensure_trt_ready_onnx = _no_sidecar

        self.ParametersDict = ParametersDict
        self.TargetFaceCardButton = TargetFaceCardButton
        dfm = DFMModelManager(os.path.join(self.app, "model_assets", "dfm_models"))

        def defaults(layouts):
            out = {}
            for layout in layouts:
                for group in layout.values():
                    for name, w in group.items():
                        if not isinstance(w, dict) or "default" not in w:
                            continue
                        v = w["default"]
                        if callable(v):
                            v = v(dfm)
                        if "Toggle" in name:
                            v = bool(v)
                        elif "Selection" in name:
                            pass
                        elif "DecimalSlider" in name:
                            v = float(v)
                        elif "Slider" in name:
                            v = int(v)
                        elif "Text" in name:
                            v = str(v)
                        out[name] = v
            return out

        dp = defaults([COMMON_LAYOUT_DATA, SWAPPER_LAYOUT_DATA, FACE_EDITOR_LAYOUT_DATA])
        dp["MaskShowSelection"] = MASK_SHOW_DEFAULT
        self.default_params = dp
        dc = defaults([SETTINGS_LAYOUT_DATA, DENOISER_LAYOUT_DATA])
        dc["OutputMediaFolder"] = ""
        self.default_control = dc

        mw = SimpleNamespace(
            gpu_id=0,
            target_faces={},
            input_faces={},
            merged_embeddings={},
            parameters={},
            control=dict(dc),
            swapfacesButton=Btn(True),
            editFacesButton=Btn(False),
            faceCompareCheckBox=Btn(False),
            faceMaskCheckBox=Btn(False),
            fixed_unet_model_name="RefLDM_UNET_EXTERNAL_KV",
            dfm_model_manager=dfm,
            video_processor=SimpleNamespace(processing=False, file_type="video", stop_processing=lambda: None),
        )
        mw.default_parameters = ParametersDict(dict(dp), dict(dp))
        mw.current_widget_parameters = ParametersDict(dict(dp), dict(dp))
        mw.models_processor = ModelsProcessor(mw)
        mw.function_worker = FunctionWorker(mw.models_processor)

        try:
            mw.function_worker.switch_providers_priority("CUDA")
        except Exception as e:
            log("provider switch to CUDA failed, keeping default:", e)
        self.mw = mw
        self.fw = mw.function_worker


    def workspace(self):
        path = os.path.join(self.app, "last_workspace.json")
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            log("last_workspace.json not readable:", e)
            return {}

    def presets_dir(self):
        return os.path.join(self.app, "presets")

    def preset_names(self):
        d = self.presets_dir()
        if not os.path.isdir(d):
            return []
        names = [f[:-5] for f in os.listdir(d) if f.lower().endswith(".json") and not f.lower().endswith("_ctl.json")]
        return sorted(names, key=str.lower)

    def read_preset(self, name):
        d = self.presets_dir()
        if name not in self.preset_names():
            raise ValueError("unknown preset")
        with open(os.path.join(d, name + ".json"), "r", encoding="utf-8") as f:
            params = json.load(f)
        ctl = {}
        ctl_path = os.path.join(d, name + "_ctl.json")
        if os.path.exists(ctl_path):
            with open(ctl_path, "r", encoding="utf-8") as f:
                ctl = json.load(f)
        return params, ctl


    PRESET_IGNORED = ("InputFolder", "OutputFolder")

    def matching_preset(self, template, control, explain=False):
        
        base = dict(self.default_params)

        def eff(d):
            out = dict(base, **dict(getattr(d, "data", d)))
            for k in self.PRESET_IGNORED:
                out.pop(k, None)
            return out

        current = eff(template)
        best = None
        for name in self.preset_names():
            try:
                params, _ctl = self.read_preset(name)
            except Exception as e:
                log("preset not readable:", name, e)
                continue


            keys = [k for k in dict(params) if k not in self.PRESET_IGNORED]
            diff = sorted(k for k in keys if dict(params).get(k) != current.get(k))
            if not diff:
                return name
            if explain:
                if best is None or len(diff) < len(best[1]):
                    best = (name, diff)
        if explain and best:
            log(f"VisoMaster's settings match no preset; closest '{best[0]}' differs in {len(best[1])}:",
                ", ".join(best[1][:12]) + (" ..." if len(best[1]) > 12 else ""))
        return ""


    def to_tensor(self, rgb):
        import numpy as np
        import torch
        return torch.from_numpy(np.ascontiguousarray(rgb)).to(self.mw.models_processor.device).permute(2, 0, 1)

    def detect(self, img, control, max_num):
        c = control
        _, kpss_5, _ = self.fw.run_detect(
            img,
            c.get("DetectorModelSelection", "RetinaFace"),
            max_num=max_num,
            score=float(c.get("DetectorScoreSlider", 50)) / 100.0,
            input_size=(512, 512),
            use_landmark_detection=c.get("LandmarkDetectToggle", False),
            landmark_detect_mode=c.get("LandmarkDetectModelSelection", "203"),
            landmark_score=float(c.get("LandmarkDetectScoreSlider", 50)) / 100.0,
            from_points=c.get("DetectFromPointsToggle", False),
            rotation_angles=[0, 90, 180, 270] if c.get("AutoRotationToggle", False) else [0],
            bypass_bytetrack=True,
        )
        return kpss_5

class Target:


    def __init__(self, rt, face_id, cropped_bgr, store):
        self.main_window = rt.mw
        self.face_id = face_id
        self.media_path = ""
        self.cropped_face = cropped_bgr
        self.embedding_store = store
        self.assigned_input_faces = {}
        self.assigned_merged_embeddings = {}
        self.picked = []
        self.assigned_input_embedding = {}
        self.assigned_kv_map = None
        self.aged_input_embedding = {}
        self.aged_kv_map = None
        self.kv_data_color_transferred = False
        self.mouth_openness_state = None
        cls = rt.TargetFaceCardButton
        self._get_embedding = cls.get_embedding
        self._calc = cls.calculate_assigned_input_embedding

    def get_embedding(self, model):
        return self._get_embedding(self, model)

    def set_embedding(self, model, emb):
        self.embedding_store[model] = emb

    def calculate_assigned_input_embedding(self):
        return self._calc(self)

    def isChecked(self):
        return False

class InputFace:
    

    def __init__(self, face_id, path, kind="image"):
        self.face_id = face_id
        self.media_path = path
        self.kind = kind
        self.embedding_store = {}
        self.cropped_face = None
        self.kv_map = None
        self.kv_map_list = None
        self.thumb = None
        self.no_face = False
        self.error = ""

    def isChecked(self):
        return False

class Session:
    def __init__(self, rt, sid):
        self.sid = sid
        ws = rt.workspace()
        self.control = dict(rt.default_control)
        self.control.update({k: v for k, v in (ws.get("control") or {}).items() if k in rt.default_control or k.endswith(("Toggle", "Selection", "Slider", "Text"))})
        tmpl = dict(rt.default_params)
        tmpl.update(ws.get("current_widget_parameters") or {})
        self.template = rt.ParametersDict(tmpl, dict(rt.default_params))

        self.input_folder = rt.input_folder_override or ""
        self.preset = rt.matching_preset(self.template, self.control)
        self.targets = {}
        self.params = {}
        self.order = []
        self.touched = time.time()
        self.stream = None
        self.start_seq = 0
        self.connected = False

class State:
    def __init__(self, rt):
        self.rt = rt
        self.sessions = {}
        self.inputs = {}
        self.lock = threading.Lock()

    def session(self, sid):
        if not sid or len(sid) > 64:
            raise ValueError("bad session")
        with self.lock:
            now = time.time()
            self._prune(now)
            s = self.sessions.get(sid)
            if s is None:
                s = Session(self.rt, sid)
                self.sessions[sid] = s
            s.touched = now
            return s

    def _prune(self, now):
        
        for k in [k for k, s in self.sessions.items()
                  if now - s.touched > (CONNECTED_IDLE_SECONDS if s.connected else SESSION_IDLE_SECONDS)
                  and not (s.stream and not s.stream.stop_event.is_set() and not s.stream.finished)]:
            self._drop(k)

    def _drop(self, sid):
        s = self.sessions.pop(sid, None)
        if s and s.stream:
            s.stream.stop()

    def input_id(self, path):
        
        try:
            st = os.stat(path)
            stamp = f"|{st.st_mtime_ns}|{st.st_size}"
        except OSError:
            stamp = ""
        key = os.path.normcase(os.path.abspath(path)) + stamp
        return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]

def jpeg_b64(bgr, max_side=256):
    import cv2
    h, w = bgr.shape[:2]
    scale = min(1.0, max_side / float(max(h, w)))
    if scale < 1.0:
        bgr = cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf.tobytes()).decode("ascii") if ok else ""

def read_image(path):
    import cv2
    import numpy as np
    data = np.fromfile(path, dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)

def list_images(folder, recursive):
    return list_files(folder, recursive, IMAGE_EXT)

def list_files(folder, recursive, exts):
    out = []
    if recursive:
        for dirpath, dirnames, filenames in os.walk(folder):
            dirnames.sort(key=str.lower)
            for f in sorted(filenames, key=str.lower):
                if os.path.splitext(f)[1].lower() in exts:
                    out.append(os.path.join(dirpath, f))
    else:
        for f in sorted(os.listdir(folder), key=str.lower):
            p = os.path.join(folder, f)
            if os.path.isfile(p) and os.path.splitext(f)[1].lower() in exts:
                out.append(p)
    return out

def read_frame(path, seconds):
    import cv2
    cap = cv2.VideoCapture(path)
    try:
        if not cap.isOpened():
            raise ValueError("video not readable")
        cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, seconds) * 1000.0)
        ok, frame = cap.read()
        if not ok or frame is None:
            raise ValueError("no frame at that position")
        return frame
    finally:
        cap.release()

def op_find_faces(st, body):
    rt = st.rt
    s = st.session(body.get("session"))
    path = body.get("path") or ""
    bgr = read_frame(path, float(body.get("time") or 0))
    rgb = bgr[..., ::-1]
    found = []
    rt.gpu(lambda: _find_on_gpu(rt, s, rgb, found))
    return {"faces": faces_json(s), "new": found}

def _find_on_gpu(rt, s, rgb, found):
    with rt.lock:
        c = s.control
        rt.mw.control = c
        img = rt.to_tensor(rgb)
        kpss = rt.detect(img, c, int(c.get("MaxFacesToDetectSlider", 20)))
        rec = str(c.get("RecognitionModelSelection", "arcface_128"))
        for kps in kpss:
            emb, crop = rt.fw.run_recognize_direct(img, kps, "Auto", rec)
            known = False
            for fid, t in s.targets.items():
                thr = s.params[fid].get("SimilarityThresholdSlider", 60)
                if rt.fw.findCosineDistance(t.get_embedding(rec), emb) >= thr:
                    known = True
                    break
            if known:
                continue
            import numpy as np
            crop_bgr = np.ascontiguousarray(crop.cpu().numpy()[..., ::-1])
            fid = str(uuid.uuid1())
            s.targets[fid] = Target(rt, fid, crop_bgr, {rec: emb})
            s.params[fid] = rt.ParametersDict(dict(s.template.data), dict(rt.default_params))
            s.order.append(fid)
            found.append(fid)

def faces_json(s):
    out = []
    targets = dict(s.targets)
    for fid in list(s.order):
        t = targets.get(fid)
        if t is None:
            continue
        out.append({"id": fid, "thumb": jpeg_b64(t.cropped_face, 192), "assigned": list(t.picked)})
    return out

def op_clear(st, body):
    s = st.session(body.get("session"))
    with st.rt.lock:
        s.targets.clear()
        s.params.clear()
        s.order.clear()
    return {"faces": []}

def op_remove_face(st, body):
    s = st.session(body.get("session"))
    fid = body.get("target")
    with st.rt.lock:
        s.targets.pop(fid, None)
        s.params.pop(fid, None)
        if fid in s.order:
            s.order.remove(fid)
    return {"faces": faces_json(s)}

def op_faces(st, body):
    s = st.session(body.get("session"))
    return {"faces": faces_json(s), "preset": s.preset}

def op_input_faces(st, body):
    s = st.session(body.get("session"))
    root = s.input_folder
    if not root or not os.path.isdir(root):
        return {"groups": [], "error": "No input faces folder is set (Dashboard > Plugins > VisoMaster > Input Faces Folder)."}
    groups = []
    listed = set()
    swap_model, swap_arcface = session_arcface(st.rt, s)

    def entry(p, kind):
        iid = st.input_id(p)
        with st.lock:
            f = st.inputs.get(iid)
            if f is None:
                f = st.inputs[iid] = InputFace(iid, p, kind)
        listed.add(iid)
        return f

    def embedding(jp):
        f = entry(jp, "embedding")
        load_embedding(f)
        return f, {"id": f.face_id, "error": f.error,
                   "missing": "" if f.error or swap_arcface in f.embedding_store else swap_model}

    def flats(folder, recursive):
        
        out, thumbs = [], set()
        for jp in list_files(folder, recursive, (".json",)):
            if os.path.basename(jp).lower() == EMBEDDING_NAME:
                continue
            stem = os.path.splitext(jp)[0]
            tp = next((stem + "-thumb" + e for e in IMAGE_EXT if os.path.isfile(stem + "-thumb" + e)), "")
            f, e = embedding(jp)
            if f.error:
                continue
            if tp:
                thumbs.add(os.path.normcase(tp))
            e.update({"name": os.path.basename(stem), "thumb": entry(tp, "preview").face_id if tp else ""})
            out.append(e)
        return out, thumbs

    def group(gid, name, files, flat, thumbs, folder=None):
        ids, cover = [], ""
        for p in files:
            if os.path.normcase(p) in thumbs:
                continue
            if os.path.basename(p).lower() == PREVIEW_NAME:
                if not cover:
                    cover = entry(p, "preview").face_id
                continue
            ids.append(entry(p, "image").face_id)
        if not cover:
            cover = ids[0] if ids else next((e["thumb"] for e in flat if e["thumb"]), "")
        g = {"id": gid, "name": name, "cover": cover, "images": ids, "flat": flat}
        jp = os.path.join(folder, EMBEDDING_NAME) if folder else ""
        if jp and os.path.isfile(jp):
            g["embedding"] = embedding(jp)[1]
        return g

    root_flat, root_thumbs = flats(root, False)
    loose = [p for p in list_images(root, False) if os.path.normcase(p) not in root_thumbs]
    if loose:
        groups.append(group("root", os.path.basename(os.path.normpath(root)) or root, loose, [], root_thumbs))
    for d in sorted(os.listdir(root), key=str.lower):
        full = os.path.join(root, d)
        if os.path.isdir(full):
            flat, thumbs = flats(full, True)
            groups.append(group("d:" + d, d, list_images(full, True), flat, thumbs, full))
    refresh_inputs(st, listed)
    return {"groups": groups, "embeddings": root_flat}

def session_arcface(rt, s):

    swap_model = str(s.template.get("SwapModelSelection", "Inswapper128"))
    try:
        return swap_model, rt.fw.get_arcface_model(swap_model)
    except ValueError:
        return swap_model, ""

def load_embedding(f):
    
    if f.embedding_store or f.error:
        return
    import numpy as np
    try:
        with open(f.media_path, encoding="utf-8") as fh:
            data = json.load(fh)
        first = data[0] if isinstance(data, list) and data else data
        store = first.get("embedding_store") if isinstance(first, dict) else None
        if not isinstance(store, dict) or not store:
            raise ValueError("no embedding_store")
        f.embedding_store = {str(k): np.asarray(v, dtype=np.float32) for k, v in store.items()}
    except (OSError, ValueError, TypeError, AttributeError) as e:
        f.embedding_store = {}
        f.error = "unreadable embedding file"
        if os.path.basename(f.media_path).lower() == EMBEDDING_NAME:
            log("embedding.json not usable:", f.media_path, e)

def refresh_inputs(st, listed):
    rt = st.rt
    with st.lock:
        gone = {iid: f for iid, f in st.inputs.items() if iid not in listed}
        for iid in gone:
            st.inputs.pop(iid, None)
        by_path = {os.path.normcase(f.media_path): iid for iid, f in st.inputs.items()}
        sessions = list(st.sessions.values())
    if not gone:
        return
    remap = {old: by_path.get(os.path.normcase(f.media_path)) for old, f in gone.items()}

    def reassign():
        with rt.lock:
            for iid in gone:
                rt.mw.input_faces.pop(iid, None)
            for s in sessions:
                for fid, t in list(s.targets.items()):
                    ids = list(t.picked)
                    if any(i in gone for i in ids):
                        assign_inputs(st, s, fid, [remap[i] if i in gone else i for i in ids if i not in gone or remap[i]])
    rt.gpu(reassign)

def thumb(st, iid):
    with st.lock:
        f = st.inputs.get(iid)
    if f is None or f.kind == "embedding":
        return None
    if f.thumb is None:
        img = read_image(f.media_path)
        f.thumb = base64.b64decode(jpeg_b64(img, 256)) if img is not None else b""
    return f.thumb

def ensure_input_embedding(rt, f, models, control):
    need = [m for m in models if m not in f.embedding_store]
    if not need or f.no_face:
        return
    img_bgr = read_image(f.media_path)
    if img_bgr is None:
        f.no_face = True
        return
    img = rt.to_tensor(img_bgr[..., ::-1])
    kpss = rt.detect(img, control, 1)
    if len(kpss) == 0:
        f.no_face = True
        return
    import numpy as np
    for m in need:
        emb, crop = rt.fw.run_recognize_direct(img, kpss[0], "Auto", m)
        f.embedding_store[m] = emb
        if f.cropped_face is None:
            f.cropped_face = np.ascontiguousarray(crop.cpu().numpy()[..., ::-1])
    f.embedding_store["kps_5"] = kpss[0]

def op_assign(st, body):
    rt = st.rt
    s = st.session(body.get("session"))
    fid = body.get("target")
    t = s.targets.get(fid)
    if t is None:
        raise ValueError("unknown target face")
    ids = [i for i in (body.get("inputs") or []) if isinstance(i, str)]
    assign_inputs(st, s, fid, ids)
    with st.lock:
        rejected = [i for i in ids if st.inputs.get(i) is not None and st.inputs[i].kind == "image" and st.inputs[i].no_face]
    return {"faces": faces_json(s), "rejected": rejected}

def assign_inputs(st, s, fid, ids):

    rt = st.rt
    t = s.targets[fid]
    with rt.lock:
        rt.mw.control = s.control
        rec = str(s.control.get("RecognitionModelSelection", "arcface_128"))
        swap_model = str(s.params[fid].get("SwapModelSelection", "Inswapper128"))
        arcface = rt.fw.get_arcface_model(swap_model)
        models = {rec, arcface}
        t.assigned_input_faces = {}
        t.assigned_merged_embeddings = {}
        picked = []
        for iid in ids:
            with st.lock:
                f = st.inputs.get(iid)
            if f is None or f.kind == "preview":
                continue
            if f.kind == "embedding":


                load_embedding(f)
                if f.error:
                    continue
                picked.append(iid)
                if arcface in f.embedding_store:
                    rt.mw.merged_embeddings[iid] = f
                    t.assigned_merged_embeddings[iid] = f.embedding_store
                continue
            ensure_input_embedding(rt, f, models, s.control)
            if f.no_face:
                continue
            picked.append(iid)
            rt.mw.input_faces[iid] = f
            t.assigned_input_faces[iid] = f.embedding_store
        t.picked = picked
        t.calculate_assigned_input_embedding()

def op_presets(st, body):
    s = st.session(body.get("session"))
    fresh = Session(st.rt, s.sid)
    if not fresh.preset:
        st.rt.matching_preset(fresh.template, fresh.control, explain=True)
    return {"presets": st.rt.preset_names(), "current": s.preset, "workspace": fresh.preset}

def op_preset(st, body):
    
    rt = st.rt
    s = st.session(body.get("session"))
    name = body.get("name") or ""
    fresh = Session(rt, s.sid)
    if not name or name == fresh.preset:
        control, template, preset = fresh.control, fresh.template, fresh.preset
    else:
        params, ctl = rt.read_preset(name)
        template = rt.ParametersDict(dict(params), dict(rt.default_params))
        control = dict(fresh.control)
        if body.get("applyControl") and ctl:
            control.update({k: v for k, v in ctl.items() if k in rt.default_control or k.endswith(("Toggle", "Selection", "Slider", "Text"))})
        preset = name
    def apply():
        with rt.lock:
            s.control, s.template, s.preset = control, template, preset
            for fid in s.order:
                s.params[fid] = rt.ParametersDict(dict(template.data), dict(rt.default_params))
            rt.mw.control = s.control
            for fid, t in list(s.targets.items()):
                ids = list(t.picked)
                if ids:
                    assign_inputs(st, s, fid, ids)
                else:
                    t.calculate_assigned_input_embedding()

    rt.gpu(apply)
    return {"current": s.preset}

def ffmpeg_exe():
    return shutil.which("ffmpeg") or "ffmpeg"

_NVENC = None

_SAR_CACHE = {}

def probe_sar(path):
    if path in _SAR_CACHE:
        return _SAR_CACHE[path]
    _SAR_CACHE[path] = _probe_sar(path)
    return _SAR_CACHE[path]

def _probe_sar(path):

    exe = shutil.which("ffprobe") or "ffprobe"
    try:
        out = subprocess.run([exe, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=sample_aspect_ratio",
                              "-of", "csv=p=0", path], capture_output=True, text=True, timeout=30).stdout.strip()
        num, den = out.split(":")[:2]
        sar = float(num) / float(den)
        return sar if 0.2 < sar < 5 else 1.0
    except Exception:
        return 1.0
PIPE_DEPTH = 4
MAX_LEAD_SECONDS = 6.0
SEND_AHEAD_SECONDS = 30.0
CONNECTED_IDLE_SECONDS = 1800.0
NO_READER_SECONDS = 150.0
MAX_BAD_FRAMES = 50

def has_nvenc():

    global _NVENC
    if _NVENC is None:
        try:
            r = subprocess.run([ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=black:s=256x144:d=0.2",
                                "-c:v", "h264_nvenc", "-f", "null", "-"], capture_output=True, timeout=30)
            _NVENC = r.returncode == 0
        except Exception:
            _NVENC = False
        log("NVENC", "available" if _NVENC else "not available - using libx264")
    return _NVENC

LIVE_STREAMS = weakref.WeakSet()
LIVE_WORKERS = weakref.WeakSet()

def release_frame_worker(rt, worker):
    if worker is None:
        return
    with rt.lock:
        rt.mw.target_faces = {}
        rt.mw.parameters = {}
        pp = getattr(worker, "pipeline_processor", None)
        if pp is not None:
            for name in ("_drift_cache", "_gabor_kernels_cache", "_gabor_kernels_expanded_cache", "_color_stats_ema"):
                c = getattr(pp, name, None)
                if hasattr(c, "clear"):
                    c.clear()
            pp._kernel_lap = pp._kernel_sobel_x = pp._kernel_sobel_y = None
        for name in ("pipeline_processor", "vr_processor", "standard_processor", "frame", "parameters",
                     "_smoothed_kps", "_resize_cache", "last_detected_faces"):
            try:
                setattr(worker, name, None)
            except Exception:
                pass

def gpu_numbers():
    try:
        import torch
        if not torch.cuda.is_available():
            return {}
        free, _total = torch.cuda.mem_get_info()
        return {"vramMB": torch.cuda.memory_allocated() // 2**20, "reservedMB": torch.cuda.memory_reserved() // 2**20,
                "freeMB": free // 2**20}
    except Exception:
        return {}

class Stream:
    

    def __init__(self, st, s, path, start, fps_cap=0.0, lead=MAX_LEAD_SECONDS):
        import cv2
        self.st, self.s = st, s
        self.lead = max(2.0, min(300.0, float(lead or MAX_LEAD_SECONDS)))
        self.id = uuid.uuid4().hex
        self.stop_event = threading.Event()
        self.buf = queue.Queue()
        self.init = b""
        self.init_ready = threading.Event()
        self.cond = threading.Condition()
        self.frames = 0
        self.client_pos = 0.0
        self.readers = 0
        self.reader_left = time.time()
        self.last_report = time.time()
        self.swap_ms = []
        self.dec_ms = []
        self.write_ms = []
        self.stats = {}
        self.stats_at = time.time()
        self.stats_frames = 0
        self.error = ""
        self.finished = False
        self.stderr_tail = []
        self.cap = cv2.VideoCapture(path)
        if not self.cap.isOpened():
            raise ValueError("video not readable")
        try:
            self.src_fps = self.cap.get(cv2.CAP_PROP_FPS) or 24.0
            if self.src_fps <= 1 or self.src_fps > 240:
                self.src_fps = 24.0
            count = self.cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
            self.duration = count / self.src_fps if count > 0 else 0.0


            cap_fps = float(fps_cap or 0)
            self.fps = min(self.src_fps, cap_fps) if cap_fps > 0 else self.src_fps



            start = max(0.0, start)
            self.cap.set(cv2.CAP_PROP_POS_MSEC, max(0.0, start - 2.0) * 1000.0)
            first, pos = None, 0.0
            for _ in range(int(self.src_fps * 4) + 2):
                ok, frm = self.cap.read()
                if not ok or frm is None:
                    break
                first = frm

                pos = self.cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                if pos <= 0 or pos >= start - 0.5 / self.src_fps:
                    break
            if first is None:
                raise ValueError("no frame at that position")
            self.t0 = pos if pos > 0 else start
            self.first = first
            h, w = first.shape[:2]

            self.sar = probe_sar(path)
            scale = f"scale=trunc(iw*{self.sar:.6f}/2)*2:trunc(ih/2)*2,setsar=1" if abs(self.sar - 1.0) > 0.01 else "scale=trunc(iw/2)*2:trunc(ih/2)*2"
            self.w, self.h = w, h






            qp = "19"
            enc = (["-c:v", "h264_nvenc", "-preset", "p4", "-rc", "constqp", "-qp", qp,
                    "-bf", "0", "-rc-lookahead", "0", "-zerolatency", "1", "-delay", "0"] if has_nvenc()
                   else ["-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency", "-crf", str(int(qp) - 1)])
            gop = str(max(1, int(round(self.fps * 2))))
            cmd = [ffmpeg_exe(), "-hide_banner", "-loglevel", "error",
                   "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", f"{self.fps:.6f}", "-i", "-",
                   "-an", "-vf", scale + ",format=yuv420p", *enc, "-g", gop,
                   "-movflags", "frag_every_frame+empty_moov+default_base_moof", "-flush_packets", "1",
                   "-f", "mp4", "-"]
            self.proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            self.cap.release()
            raise
        threading.Thread(target=self._produce, daemon=True).start()
        threading.Thread(target=self._collect, daemon=True).start()
        threading.Thread(target=self._errors, daemon=True).start()


    def _wait_for_room(self):

        with self.cond:
            while not self.stop_event.is_set():
                now = time.time()

                if (self.readers == 0 and now - self.reader_left > NO_READER_SECONDS) or now - self.last_report > NO_READER_SECONDS:
                    log("stream", self.id[:8], "has no viewer - stopping")
                    self.stop_event.set()
                    break
                produced = self.frames / self.fps
                if produced - self.client_pos <= self.lead:
                    break
                self.cond.wait(0.5)
    def _produce(self):
        from app.processors.workers.frame_worker import FrameWorker
        import numpy as np
        import cv2
        rt = self.st.rt
        bad = 0
        worker = None
        dec = wr = None
        LIVE_STREAMS.add(self)
        try:
            worker = rt.gpu(lambda: FrameWorker(rt.mw, frame=None, frame_number=0, is_single_frame=True))
            try:
                LIVE_WORKERS.add(worker)
            except TypeError:
                pass



            frames_q = queue.Queue(maxsize=PIPE_DEPTH)
            out_q = queue.Queue(maxsize=PIPE_DEPTH)

            def qput(q, item):
                while not self.stop_event.is_set():
                    try:
                        q.put(item, timeout=0.5)
                        return True
                    except queue.Full:
                        continue
                return False

            def qget(q):
                while not self.stop_event.is_set():
                    try:
                        return q.get(timeout=0.5)
                    except queue.Empty:
                        continue
                return None

            def decode():
                frame, n, src_index = self.first, 0, 0
                try:
                    while not self.stop_event.is_set() and frame is not None:

                        if not qput(frames_q, (n, frame, np.ascontiguousarray(frame[..., ::-1]))):
                            return
                        n += 1

                        frame = None
                        t_d = time.perf_counter()
                        while not self.stop_event.is_set():
                            if not self.cap.grab():
                                self._check_end(src_index)
                                break
                            src_index += 1
                            pos = self.cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                            t_src = (pos - self.t0) if pos > 0 else src_index / self.src_fps
                            if t_src + 0.5 / self.src_fps >= n / self.fps:
                                ok, nxt = self.cap.retrieve()
                                frame = nxt if ok else None
                                if frame is None:
                                    self._check_end(src_index)
                                break
                        self.dec_ms.append((time.perf_counter() - t_d) * 1000.0)
                except Exception as e:
                    self.error = f"decoder: {type(e).__name__}: {e}"
                    log("stream", self.id[:8], self.error)
                    self.stop_event.set()
                finally:
                    qput(frames_q, None)

            def write():
                try:
                    while True:
                        out = qget(out_q)
                        if out is None:
                            return
                        t_w = time.perf_counter()
                        self.proc.stdin.write(out.tobytes())
                        self.write_ms.append((time.perf_counter() - t_w) * 1000.0)
                        self.frames += 1
                        self._log_speed()
                except (BrokenPipeError, OSError):
                    if not self.stop_event.is_set():
                        self.error = "The video encoder stopped: " + (" | ".join(self.stderr_tail[-3:]) or "no message")
                        log("stream", self.id[:8], self.error)
                        self.stop_event.set()

            dec = threading.Thread(target=decode, name="decode-" + self.id[:8], daemon=True)
            wr = threading.Thread(target=write, name="write-" + self.id[:8], daemon=True)
            dec.start()
            wr.start()
            while not self.stop_event.is_set():
                item = qget(frames_q)
                if item is None:
                    break
                n, frame, rgb = item
                self._wait_for_room()
                if self.stop_event.is_set():
                    break
                s = self.s
                out = frame
                if s.targets:
                    try:
                        t_swap = time.perf_counter()

                        def swap(s=s, rgb=rgb, n=n):
                            with rt.lock:
                                rt.mw.control = s.control
                                rt.mw.target_faces = dict(s.targets)
                                rt.mw.parameters = dict(s.params)
                                worker.frame = rgb
                                worker.frame_number = n
                                worker.parameters = dict(s.params)
                                return worker.process_frame(dict(s.control), self.stop_event)

                        out = rt.gpu(swap)
                        self.swap_ms.append((time.perf_counter() - t_swap) * 1000.0)
                        bad = 0
                    except Exception as e:
                        bad += 1
                        out = frame
                        if bad == 1:
                            log("frame", n, "not swapped:", f"{type(e).__name__}: {e}")
                        if bad >= MAX_BAD_FRAMES:
                            raise RuntimeError(f"{bad} frames in a row could not be swapped: {e}") from e
                if not qput(out_q, np.ascontiguousarray(out)):
                    break
            qput(out_q, None)
            wr.join(30)
            if not self.stop_event.is_set() and not self.error:
                self.finished = True
        except Exception as e:
            self.error = f"{type(e).__name__}: {e}"
            log("stream error:", self.error)
            traceback.print_exc()
            self.stop_event.set()
        finally:


            if self.error or self.stop_event.is_set():
                self.stop_event.set()
            for th in (dec, wr):
                if th is not None:
                    th.join(10)
            try:
                self.proc.stdin.close()
            except Exception:
                pass
            if dec is not None and dec.is_alive():
                log("stream", self.id[:8], "decoder still busy - capture left open")
            else:
                self.cap.release()
            LIVE_STREAMS.discard(self)
            try:
                w, worker = worker, None
                rt.gpu(lambda: release_frame_worker(rt, w))
                w = None
            except Exception as e:
                log("stream", self.id[:8], "cleanup failed:", f"{type(e).__name__}: {e}")

    def _check_end(self, src_index):

        at = self.t0 + src_index / self.src_fps
        if self.duration and at < self.duration - 2.0 and not self.stop_event.is_set():
            m, s = divmod(int(at), 60)
            self.error = f"The film could not be read at {m // 60}:{m % 60:02d}:{s:02d}."
            log("stream", self.id[:8], self.error)
            self.stop_event.set()
    def _log_speed(self):

        now = time.time()
        if now - self.stats_at < 10:
            return
        span = now - self.stats_at
        fps = (self.frames - self.stats_frames) / span if span > 0 else 0.0
        ms = sorted(self.swap_ms)
        self.stats = {
            "fps": round(fps, 1), "needFps": round(self.fps, 2),
            "swapMsAvg": round(sum(ms) / len(ms), 1) if ms else 0.0,
            "swapMsP95": round(ms[int(len(ms) * 0.95) - 1], 1) if len(ms) >= 20 else (round(ms[-1], 1) if ms else 0.0),
            "swapMsMax": round(ms[-1], 1) if ms else 0.0,

            "decMsAvg": round(sum(self.dec_ms) / len(self.dec_ms), 1) if self.dec_ms else 0.0,
            "writeMsAvg": round(sum(self.write_ms) / len(self.write_ms), 1) if self.write_ms else 0.0,
            "size": f"{self.w}x{self.h}",
            "ahead": round(self.frames / self.fps - self.client_pos, 1), "faces": len(self.s.targets),

            "streams": len(LIVE_STREAMS), "workers": len(LIVE_WORKERS), **gpu_numbers(),
        }
        log("speed", self.id[:8], " ".join(f"{k}={v}" for k, v in self.stats.items()))
        self.stats_at, self.stats_frames, self.swap_ms, self.dec_ms, self.write_ms = now, self.frames, [], [], []



    def _collect(self):
        data = b""
        fragment = b""
        out = self.proc.stdout
        while True:
            chunk = out.read1(256 * 1024) if hasattr(out, "read1") else out.read(65536)
            if not chunk:
                break
            data += chunk
            while len(data) >= 8:
                size = int.from_bytes(data[0:4], "big")
                kind = data[4:8]
                if size == 1 and len(data) >= 16:
                    size = int.from_bytes(data[8:16], "big")
                if size < 8:
                    log("stream", self.id[:8], "unexpected MP4 box size", size)
                    data = b""
                    break
                if len(data) < size:
                    break
                box, data = data[:size], data[size:]
                if not self.init_ready.is_set():
                    self.init += box
                    if kind == b"moov":
                        self.init_ready.set()
                    continue
                fragment += box
                if kind == b"mdat":
                    self.buf.put(fragment)
                    fragment = b""
        self.init_ready.set()
        self.buf.put(None)

    def _errors(self):
        for line in self.proc.stderr:
            text = line.decode("utf-8", "replace").rstrip()
            self.stderr_tail = (self.stderr_tail + [text])[-10:]
            log("ffmpeg:", text)



    def reader_enter(self):
        with self.cond:
            self.readers += 1
            self.cond.notify_all()

    def reader_exit(self):
        with self.cond:
            self.readers = max(0, self.readers - 1)
            self.reader_left = time.time()
            self.cond.notify_all()

    def take(self, timeout):
        return self.buf.get(timeout=timeout)

    def set_position(self, pos):
        with self.cond:
            self.client_pos = max(0.0, float(pos))
            self.last_report = time.time()
            self.cond.notify_all()

    def stop(self):
        self.stop_event.set()
        with self.cond:
            self.cond.notify_all()
        try:
            self.proc.kill()
        except Exception:
            pass

def op_swap_start(st, body):
    s = st.session(body.get("session"))
    if not any(t.assigned_input_faces or t.assigned_merged_embeddings for t in s.targets.values()):
        raise ValueError("No face has an input face assigned.")
    with st.lock:
        s.start_seq += 1
        mine = s.start_seq
        old, s.stream = s.stream, None
    if old:
        old.stop()
    stream = Stream(st, s, body.get("path") or "", float(body.get("time") or 0),
                    fps_cap=float(body.get("fps") or 0), lead=float(body.get("lead") or MAX_LEAD_SECONDS))
    with st.lock:
        if s.start_seq != mine:
            stream.stop()
            return {"stale": True}
        if s.stream:
            s.stream.stop()
        s.stream = stream
    return {"stream": stream.id, "t0": stream.t0, "fps": stream.fps}

def connected_count(st):
    with st.lock:
        st._prune(time.time())
        return sum(1 for x in st.sessions.values() if x.connected)

def op_connect(st, body):

    prev = body.get("previous")
    if prev and prev != body.get("session"):
        with st.lock:
            st._drop(prev)
    s = st.session(body.get("session"))
    s.connected = True
    c = s.control
    cap = float(c.get("OutputMaxFpsSlider") or 0) if c.get("OutputFpsCapEnableToggle") else 0.0
    return {"connected": connected_count(st), "fpsCap": cap, "preset": s.preset}

def op_disconnect(st, body):

    sid = body.get("session")
    with st.lock:
        st._drop(sid)
    return {"connected": connected_count(st)}

def op_swap_stop(st, body):
    sid = body.get("session")
    wanted = body.get("stream")
    with st.lock:
        s = st.sessions.get(sid) if sid else None
        if s is None:
            return {"ok": True}
        x = s.stream
        if not wanted or (x and wanted == x.id):
            s.start_seq += 1
        if x and (not wanted or wanted == x.id):
            s.stream = None
        else:
            x = None
    if x:
        x.stop()
    return {"ok": True}

def op_status(st, body):
    sid = body.get("session")
    with st.lock:
        s = st.sessions.get(sid) if sid else None
    if s is None:
        return {"running": False, "unknownSession": True}
    s.touched = time.time()
    x = s.stream
    if not x or (body.get("stream") and body.get("stream") != x.id):
        return {"running": False}
    if body.get("lead") is not None:
        try:
            x.lead = max(2.0, min(300.0, float(body.get("lead"))))
        except (TypeError, ValueError):
            pass
        with x.cond:
            x.cond.notify_all()
    if body.get("pos") is not None:
        x.set_position(body.get("pos"))
    return {"running": not x.stop_event.is_set(), "stream": x.id, "t0": x.t0, "fps": x.fps, "frames": x.frames,
            "until": x.t0 + x.frames / x.fps, "error": x.error, "finished": x.finished, "speed": x.stats}

GPU_OPS = {"/assign", "/clear", "/remove_face"}
OPS = {
    "/find_faces": op_find_faces,
    "/clear": op_clear,
    "/remove_face": op_remove_face,
    "/faces": op_faces,
    "/input_faces": op_input_faces,
    "/assign": op_assign,
    "/presets": op_presets,
    "/preset": op_preset,
    "/swap/start": op_swap_start,
    "/swap/stop": op_swap_stop,
    "/status": op_status,
    "/connect": op_connect,
    "/disconnect": op_disconnect,
}

def make_handler(st, token):
    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *args):
            pass

        def _auth(self):
            if self.headers.get("X-VM-Token") != token:
                self._json(403, {"error": "forbidden"})
                return False
            return True

        def _json(self, code, obj):
            data = json.dumps(obj).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            if not self._auth():
                return
            u = urlparse(self.path)
            if u.path == "/health":
                rt = st.rt
                return self._json(200, {"ready": rt.ready, "error": rt.error})
            if u.path.startswith("/thumb/"):
                b = thumb(st, u.path[len("/thumb/"):])
                if not b:
                    return self._json(404, {"error": "not found"})
                self.send_response(200)
                self.send_header("Content-Type", "image/jpeg")
                self.send_header("Content-Length", str(len(b)))
                self.end_headers()
                self.wfile.write(b)
                return
            if u.path.startswith("/stream/"):
                return self._stream(u.path[len("/stream/"):])
            return self._json(404, {"error": "not found"})

        def _stream(self, sid):
            stream = None
            with st.lock:
                sessions = list(st.sessions.values())
            for s in sessions:
                if s.stream and s.stream.id == sid:
                    stream = s.stream
            if stream is None:
                return self._json(404, {"error": "no such stream"})
            self.send_response(200)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Transfer-Encoding", "chunked")
            self.end_headers()
            stream.reader_enter()
            try:
                stream.init_ready.wait(300)
                if stream.init:
                    self.wfile.write(b"%X\r\n" % len(stream.init) + stream.init + b"\r\n")
                sent = 0
                while not stream.stop_event.is_set():


                    with stream.cond:
                        while (not stream.stop_event.is_set()
                               and sent / stream.fps - stream.client_pos > SEND_AHEAD_SECONDS):
                            stream.cond.wait(0.5)
                    try:
                        chunk = stream.take(1.0)
                    except queue.Empty:
                        continue
                    if chunk is None:
                        break
                    self.wfile.write(b"%X\r\n" % len(chunk) + chunk + b"\r\n")
                    sent += 1
                self.wfile.write(b"0\r\n\r\n")
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            finally:
                stream.reader_exit()

        def do_POST(self):
            if not self._auth():
                return
            u = urlparse(self.path)
            length = int(self.headers.get("Content-Length") or 0)
            try:
                body = json.loads(self.rfile.read(length) or b"{}") if length else {}
            except ValueError:
                return self._json(400, {"error": "bad json"})
            if u.path == "/shutdown":
                self._json(200, {"ok": True})
                threading.Thread(target=lambda: (time.sleep(0.2), os._exit(0)), daemon=True).start()
                return
            op = OPS.get(u.path)
            if op is None:
                return self._json(404, {"error": "not found"})
            if not st.rt.ready:
                return self._json(503, {"error": st.rt.error or "VisoMaster is still loading."})
            try:
                if u.path in GPU_OPS:
                    return self._json(200, st.rt.gpu(lambda: op(st, body)))
                return self._json(200, op(st, body))
            except ValueError as e:
                return self._json(400, {"error": str(e)})
            except Exception as e:
                traceback.print_exc()
                return self._json(500, {"error": f"{type(e).__name__}: {e}"})

    return Handler

def watch_parent(pid):

    import ctypes
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenProcess(0x00100000, False, pid)
    if not handle:
        log("parent process not found - exiting")
        os._exit(0)
    kernel32.WaitForSingleObject(handle, 0xFFFFFFFF)
    log("Jellyfin ended - worker exits")
    os._exit(0)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, help="portable VisoMaster Fusion root")
    ap.add_argument("--port", type=int, default=8766)
    ap.add_argument("--work", required=True, help="the plugin's own work folder")
    ap.add_argument("--parent-pid", type=int, default=0, help="end when this process (Jellyfin) ends")
    ap.add_argument("--input-folder", default="", help="input faces folder from the admin page (required for input faces)")
    args = ap.parse_args()
    token = os.environ.get("VM_TOKEN", "")
    if not token:
        sys.exit("VM_TOKEN missing")
    os.makedirs(args.work, exist_ok=True)
    os.chdir(args.work)
    if args.parent_pid:
        threading.Thread(target=watch_parent, args=(args.parent_pid,), daemon=True).start()
    rt = Runtime(args.root)
    rt.input_folder_override = args.input_folder
    st = State(rt)
    threading.Thread(target=rt.load, daemon=True).start()
    class QuietServer(ThreadingHTTPServer):
        def handle_error(self, request, client_address):
            if isinstance(sys.exc_info()[1], (ConnectionError, TimeoutError)):
                return
            super().handle_error(request, client_address)

    server = QuietServer(("127.0.0.1", args.port), make_handler(st, token))
    server.daemon_threads = True
    log(f"worker on 127.0.0.1:{args.port}, VisoMaster at {args.root}")
    server.serve_forever()

if __name__ == "__main__":
    main()
