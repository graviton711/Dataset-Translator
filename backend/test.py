import os
import json

# --- PHẦN 1: CẤU HÌNH CUDA (TRÍCH TỪ CODE CỦA BẠN) ---
# Đoạn này rất quan trọng để Windows tìm thấy thư viện GPU
if os.name == 'nt':
    cuda_path = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.4\bin"
    if os.path.exists(cuda_path):
        os.add_dll_directory(cuda_path)
        os.environ['PATH'] = cuda_path + ";" + os.environ['PATH']
        print(f"Đã thêm CUDA path: {cuda_path}")

try:
    from llama_cpp import Llama
except ImportError:
    print("Lỗi: Chưa cài thư viện llama-cpp-python. Hãy chạy: pip install llama-cpp-python")
    exit()

# --- PHẦN 2: LOAD MODEL ---
# Đường dẫn tới file model (Đảm bảo file này tồn tại)
model_path = os.path.join("model", "qwen2.5-3b-instruct-q4_k_m.gguf")

if not os.path.exists(model_path):
    print(f"LỖI: Không tìm thấy file model tại {model_path}")
    exit()

print(f"Đang load model lên GPU (RTX 3050Ti)...")

# Khởi tạo model với thông số từ agent.py của bạn
llm = Llama(
    model_path=model_path,
    n_ctx=2048,       # Context window
    n_gpu_layers=-1,  # QUAN TRỌNG: -1 để đẩy tất cả layers vào VRAM
    n_threads=4,      # Giới hạn CPU threads
    verbose=True      # Bật log để xem chi tiết layer được load
)

# --- PHẦN 3: GỬI REQUEST & IN KẾT QUẢ ---
print("\n--- BẮT ĐẦU TEST ---")
user_prompt = "Xin chào, bạn là ai và bạn có thể làm gì?"

messages = [
    {"role": "system", "content": "You are a helpful AI assistant."},
    {"role": "user", "content": user_prompt}
]

print(f"User: {user_prompt}")
print("Đang sinh câu trả lời...")

output = llm.create_chat_completion(
    messages=messages,
    max_tokens=256,
    temperature=0.7
)

response_text = output['choices'][0]['message']['content']

print("-" * 50)
print(f"AI Response:\n{response_text}")
print("-" * 50)