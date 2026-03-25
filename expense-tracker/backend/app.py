from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from config import Config

app = Flask(__name__)
# Enable CORS for all routes (important for frontend communication)
CORS(app)

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]
expenses_collection = db["expenses"]

@app.route('/add', methods=['POST'])
def add_expense():
    try:
        data = request.json
        
        # Simple Validation
        required_fields = ['amount', 'category', 'description', 'date', 'paymentMethod']
        for field in required_fields:
            if field not in data or not str(data[field]).strip():
                return jsonify({"error": f"Missing or empty field: {field}"}), 400
                
        expense = {
            "amount": float(data['amount']),
            "category": data['category'].strip(),
            "description": data['description'].strip(),
            "date": data['date'],
            "paymentMethod": data['paymentMethod'],
            "createdAt": datetime.utcnow()
        }
        
        result = expenses_collection.insert_one(expense)
        
        return jsonify({
            "message": "Expense added successfully",
            "id": str(result.inserted_id)
        }), 201
        
    except ValueError:
        return jsonify({"error": "Invalid amount format"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/expenses', methods=['GET'])
def get_expenses():
    try:
        query = {}
        
        # Filters based on query params
        category = request.args.get('category')
        if category and category != "All":
            query['category'] = category
            
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        if start_date or end_date:
            query['date'] = {}
            if start_date:
                query['date']['$gte'] = start_date
            if end_date:
                query['date']['$lte'] = end_date
                
        # Sort by date descending (newest first)
        expenses_cursor = expenses_collection.find(query).sort("date", -1)
        
        expenses = []
        for exp in expenses_cursor:
            exp['_id'] = str(exp['_id'])
            # Format createdAt to ISO format if it's a datetime object
            if isinstance(exp.get('createdAt'), datetime):
                exp['createdAt'] = exp['createdAt'].isoformat()
            expenses.append(exp)
            
        return jsonify(expenses), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete/<id>', methods=['DELETE'])
def delete_expense(id):
    try:
        result = expenses_collection.delete_one({"_id": ObjectId(id)})
        
        if result.deleted_count == 1:
            return jsonify({"message": "Expense deleted successfully"}), 200
        else:
            return jsonify({"error": "Expense not found"}), 404
            
    except Exception as e:
        return jsonify({"error": "Invalid ID format or other error"}), 400

@app.route('/category-summary', methods=['GET'])
def get_category_summary():
    try:
        pipeline = [
            {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
            {"$project": {"category": "$_id", "total": 1, "_id": 0}},
            {"$sort": {"total": -1}}
        ]
        summary = list(expenses_collection.aggregate(pipeline))
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/monthly-summary', methods=['GET'])
def get_monthly_summary():
    try:
        pipeline = [
            {
                "$addFields": {
                    # Assuming date is stored as "YYYY-MM-DD" string
                    "month": {"$substr": ["$date", 0, 7]} 
                }
            },
            {"$group": {"_id": "$month", "total": {"$sum": "$amount"}}},
            {"$project": {"month": "$_id", "total": 1, "_id": 0}},
            {"$sort": {"month": 1}}
        ]
        summary = list(expenses_collection.aggregate(pipeline))
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize MongoDB indexes to speed up sorting and querying
    expenses_collection.create_index("date")
    expenses_collection.create_index("category")
    app.run(debug=True, port=5000)
