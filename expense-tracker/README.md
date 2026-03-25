# Smart Expense Tracker

A modern, responsive, and robust full-stack expense tracking web application. Designed like a professional fintech product, it offers intuitive features to track personal finances.

## Project Structure
```text
expense-tracker/
│
├── backend/
│   ├── app.py              # Flask REST API handling data processing
│   ├── config.py           # Configuration management (Mongo URI)
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── index.html          # Clean & semantic UI markup
│   ├── style.css           # Modern, variable-based CSS with dark-mode
│   └── script.js           # Async API fetch logic and state rendering
└── README.md
```

## Running the Project Locally

### Prerequisites:
- Python 3.9+
- MongoDB instance running locally (default: `localhost:27017`)
- Visual Studio Code (or any modern code editor) using an HTTP server for frontend files.

### 1. Start the Backend:
1. Open your terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```
   *The server will run on `http://127.0.0.1:5000`*

### 2. View the Frontend:
1. Easiest way is to right-click on `frontend/index.html` in VS Code and select `Open with Live Server` (requires the Live Server extension).
2. Alternatively, use python to generate a quick server inside the `frontend` folder:
   ```bash
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000/index.html`.

---

## Technical Appendix

### Why NOSQL (MongoDB) is suitable for this app?
1. **Flexible Schema**: Financial documents can change over time. Users may want to add `tags`, `receiptUrls`, or an `isRecurring` flag to expenses in the feature without needing complex migration scripts.
2. **Native JSON Sync**: The frontend JS (JSON format), Flask REST API (JSON payload), and MongoDB (BSON/JSON storage) create a seamless data stream without needing complex Object-Relational Mapping (ORM) translations.
3. **Agile Iteration**: Prototyping and developing are faster when the schema isn't rigidly bound beforehand. This matches standard startup practices today.
4. **Fast Queries (Reads/Writes)**: Expense tracking generates a lot of timeseries entries. MongoDB performs exceptionally well on bulk inserts and range aggregations.

### MongoDB Indexing Strategy
To optimize filtering and read delays on growing collections, indexing is critical:

In `app.py`, we implement automated Index creation at load:
```python
expenses_collection.create_index("date")
expenses_collection.create_index("category")
```

**Why these fields?**
- `date`: Sorting in descending order `{"date": -1}` is performed on hitting the main endpoint to list recent transactions first. Filtering by a date range (This Month vs Last Month) heavily depends on this index.
- `category`: When the user uses the dropdown filter to fetch only specifically categorized items (e.g. `category="Food & Dining"`), having a single index cuts down the query plan from a COLLSCAN (collection scan) to an IXSCAN (index scan), drastically dropping load latency.

### Example Queries Handled by backend API

*Fetching All expenses sorted by latest first (Compound indexing benefit):*
```javascript
db.expenses.find({}).sort({ date: -1 })
```

*Fetching Expenses Filtered by Category:*
```javascript
db.expenses.find({ category: "Food & Dining" }).sort({ date: -1 })
```

*Adding an Expense Endpoint Example Payload:*
```javascript
db.expenses.insertOne({
    amount: 120.0,
    category: "Food & Dining",
    description: "Dinner out",
    date: "2026-03-25",
    paymentMethod: "Credit Card",
    createdAt: new ISODate("2026-03-25T13:00:00Z")
});
```

*Deleting an Expense by Object ID:*
```javascript
db.expenses.deleteOne({ _id: ObjectId("64abcd12345...") });
```
