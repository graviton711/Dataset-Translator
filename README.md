# Dataset Translator

![Dataset Translator Mockup](dataset_translator_mockup.png)

## Giới thiệu
Dataset Translator là một công cụ mạnh mẽ giúp dịch các bộ dữ liệu lớn (CSV, Excel, JSON, TXT) một cách tự động và chính xác sử dụng công nghệ AI. Dữ liệu được hiển thị trực quan dưới dạng bảng, cho phép người dùng dễ dàng theo dõi và chỉnh sửa.

## Lưu đồ hoạt động

```mermaid
graph TD
    User([User]) -->|Upload File| UI[Frontend Interface]
    UI -->|POST /upload| API[FastAPI Backend]
    API -->|Parse & Store| DB[(Firebase Firestore)]
    API -->|Return Data| UI
    User -->|Select Rows/Cols & Translate| UI
    UI -->|POST /translate| API
    API -->|Background Task| Worker[Translation Service]
    Worker -->|Fetch Data| DB
    Worker -->| Translate Text| AI[AI Models / GoogleTrans]
    AI -->|Translated Text| Worker
    Worker -->|Update| DB
    DB -->|Real-time Updates| UI
    User -->|Export| UI
    UI -->|GET /export| API
    API -->|Generate CSV| User
```

## Công nghệ sử dụng

### Frontend
- **React**: Thư viện UI chính.
- **Vite**: Build tool nhanh chóng.
- **TailwindCSS**: Styling framework.

### Backend
- **FastAPI**: Framework Python hiệu năng cao.
- **Python**: Ngôn ngữ xử lý chính.
- **Pandas**: Xử lý dữ liệu dạng bảng.

### Cơ sở dữ liệu & Services
- **Firebase Firestore**: Lưu trữ dữ liệu thời gian thực.
- **AI Models**: Sử dụng `transformers`, `llama-cpp` và `googletrans` cho việc dịch thuật.

## Cài đặt và Chạy

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
