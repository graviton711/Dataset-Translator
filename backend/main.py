from translation_service import translation_service
from firebase_service import firebase_service
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import uuid
import json

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    print("Application starting up...")
    if translation_service:
        translation_service.initialize()
    else:
        print("Warning: Translation service not available.")
    
    if not firebase_service.db:
        print("Warning: Firebase not connected. Persistence will fail.")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    dataset_id: str
    rows: list[int]
    columns: list[str]

class GlossaryItem(BaseModel):
    term: str
    translation: str
    type: str = 'pre'

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls', '.json', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload CSV, Excel, JSON, or TXT.")
    
    try:
        contents = await file.read()
        file_type = 'csv'
        columns = []
        df = pd.DataFrame()

        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
            df = df.fillna("")
            file_type = 'csv'
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
            df = df.fillna("")
            file_type = 'csv' # Treat Excel as grid
        elif file.filename.endswith('.json'):
            file_type = 'json'
            json_data = json.loads(contents)
            
            # Flatten JSON
            def flatten_json(y):
                out = {}
                def flatten(x, name=''):
                    if type(x) is dict:
                        for a in x:
                            flatten(x[a], name + a + '.')
                    elif type(x) is list:
                        for i, a in enumerate(x):
                            flatten(a, name + str(i) + '.')
                    else:
                        out[name[:-1]] = x
                flatten(y)
                return out

            flat_data = flatten_json(json_data)
            # Create DF with 'key' and 'value'
            data_list = [{"key": k, "value": v} for k, v in flat_data.items()]
            df = pd.DataFrame(data_list)
            
        elif file.filename.endswith('.txt'):
            file_type = 'txt'
            text_content = contents.decode('utf-8')
            lines = text_content.split('\n')
            # Create DF with 'line' and 'content'
            data_list = [{"line": i+1, "content": line.strip()} for i, line in enumerate(lines) if line.strip()]
            df = pd.DataFrame(data_list)

        # Prepare column info
        for col in df.columns:
            width = "150px"
            if len(str(df[col].iloc[0])) > 50:
                width = "300px"
            elif len(str(df[col].iloc[0])) < 10:
                width = "80px"
            columns.append({
                "key": col,
                "label": col,
                "width": width,
                "editable": True
            })
            
        # Save to Firebase with file_type
        dataset_id = firebase_service.create_dataset(file.filename, columns, file_type)
        if not dataset_id:
            raise HTTPException(status_code=500, detail="Failed to create dataset in Firebase")
            
        firebase_service.save_cells(dataset_id, df)
            
        return JSONResponse({
            "dataset_id": dataset_id,
            "columns": columns,
            "file_type": file_type,
            "message": "File uploaded successfully"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/dataset/{dataset_id}")
async def get_dataset(dataset_id: str, page: int = 1, limit: int = 100):
    # Fetch metadata
    meta = firebase_service.get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Fetch cells
    cells = firebase_service.get_cells(dataset_id)
    
    # Reconstruct DataFrame-like list of dicts
    # This is a bit inefficient for large data but works for now
    # Ideally we'd query Firestore with pagination
    
    if not cells:
        return JSONResponse({"data": [], "total_rows": 0})

    # Group by row_idx
    rows_map = {}
    for cell in cells:
        r = cell['row_idx']
        if r not in rows_map:
            rows_map[r] = {}
        rows_map[r][cell['col_key']] = cell['value']
        
    # Convert to list, sorted by row_idx
    data = []
    sorted_rows = sorted(rows_map.keys())
    for r in sorted_rows:
        data.append(rows_map[r])
        
    # Pagination in memory (since we fetched all)
    total_rows = len(data)
    start = (page - 1) * limit
    end = start + limit
    paginated_data = data[start:end]
    
    return JSONResponse({
        "data": paginated_data,
        "total_rows": total_rows,
        "page": page,
        "limit": limit
    })

from progress_tracker import progress_tracker

@app.post("/translate")
async def translate_dataset(request: TranslationRequest, background_tasks: BackgroundTasks):
    # Verify dataset exists
    meta = firebase_service.get_dataset_meta(request.dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Reconstruct DF for the service (it expects a DF to read from)
    # But wait, the service now needs to write to Firebase, not update a DF ref.
    # We need to adapt run_translation_task.
    
    # For now, let's fetch the data needed for translation
    cells = firebase_service.get_cells(request.dataset_id)
    # ... reconstruction logic ...
    # Actually, let's pass the dataset_id to the service and let it fetch/update directly.
    # But the service signature is (task_id, df, rows, columns).
    # We should update the service signature.
    
    # Temporary: Reconstruct full DF to pass to service, but service will update Firebase.
    rows_map = {}
    for cell in cells:
        r = cell['row_idx']
        if r not in rows_map:
            rows_map[r] = {}
        rows_map[r][cell['col_key']] = cell['value']
    
    data = []
    sorted_rows = sorted(rows_map.keys())
    for r in sorted_rows:
        data.append(rows_map[r])
    
    df = pd.DataFrame(data)
    
    task_id = request.dataset_id
    
    background_tasks.add_task(
        translation_service.run_translation_task, 
        task_id, 
        df, # Passed for reading values
        request.rows, 
        request.columns,
        request.dataset_id # Pass ID for writing back
    )
    
    return JSONResponse({
        "message": "Translation started",
        "task_id": task_id
    })

@app.get("/progress/{task_id}")
async def get_progress(task_id: str):
    task = progress_tracker.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return JSONResponse(task)

@app.post("/pause/{task_id}")
async def pause_task(task_id: str):
    progress_tracker.update_status(task_id, "paused")
    return JSONResponse({"message": "Task paused"})

@app.post("/resume/{task_id}")
async def resume_task(task_id: str):
    progress_tracker.update_status(task_id, "running")
    return JSONResponse({"message": "Task resumed"})

@app.get("/export/{dataset_id}")
async def export_dataset(dataset_id: str):
    meta = firebase_service.get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    cells = firebase_service.get_cells(dataset_id)
    
    rows_map = {}
    for cell in cells:
        r = cell['row_idx']
        if r not in rows_map:
            rows_map[r] = {}
        rows_map[r][cell['col_key']] = cell['value']
        
    data = []
    sorted_rows = sorted(rows_map.keys())
    for r in sorted_rows:
        data.append(rows_map[r])
        
    df = pd.DataFrame(data)
    
    original_filename = meta.get("filename", "export.csv")
    base_name = original_filename.rsplit('.', 1)[0]
    
    csv_content = df.to_csv(index=False)
    
    response = StreamingResponse(iter([csv_content.encode('utf-8-sig')]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename={base_name}_translated.csv"
    
    return response

# --- GLOSSARY ENDPOINTS ---
@app.get("/glossary")
# --- UNDO ENDPOINT ---
@app.post("/undo/{dataset_id}")
async def undo_action(dataset_id: str):
    result = firebase_service.undo_last_action(dataset_id)
    if not result:
        raise HTTPException(status_code=400, detail="Nothing to undo")
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
