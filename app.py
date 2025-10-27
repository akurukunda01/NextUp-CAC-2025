from flask import Flask, g, jsonify, request
import psycopg2
from flask_cors import CORS
import psycopg2.extras
import os
import requests
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity



app = Flask(__name__)
CORS(app)

CONFIG = {
    'host': 'localhost',
    'database': 'civic_app',
    'user': 'akurukunda01',
    'secret_key' : 'king',
    'port': 5432
}

def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(
            dbname=CONFIG['database'],
            user=CONFIG['user'],
            host=CONFIG['host'],
            port=CONFIG['port']
        )
        g.cursor = g.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return g.db, g.cursor

def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db_connection(error):
    close_db(error)


@app.route('/api/messages', methods=['GET'])
def getMessages():
    try:
        conn, cursor = get_db()
        cursor.execute("SELECT * FROM rep_connect_messages ORDER BY timestamp DESC")
        messages = cursor.fetchall()
        msg_list = []
        for m in messages:
            msg_list.append({
                "id": m["id"],
                "sender": m["sender"],
                "message": m["content"],
                "email": m["sender_email"],
                "timestamp": m["timestamp"],
                "is_read": m["is_read"]
            })
        conn.close()
        return jsonify(msg_list)
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sendMessage', methods=['GET', 'POST'])
def sendMessage():
    try:
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        if not all([name, email, message]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        conn, cursor = get_db()
        cursor.execute("INSERT INTO rep_connect_messages (sender, sender_email, content) VALUES (%s, %s, %s)", 
                      (name, email, message))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(f"Error sending message: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<int:message_id>', methods=['DELETE'])
def deleteMessage(message_id):
    try:
        conn, cursor = get_db()
        
       
        cursor.execute("SELECT id FROM rep_connect_messages WHERE id = %s", (message_id,))
        message = cursor.fetchone()
        
        if not message:
            conn.close()
            return jsonify({"error": "Message not found"}), 404
        
       
        cursor.execute("DELETE FROM rep_connect_messages WHERE id = %s", (message_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": f"Message {message_id} deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting message {message_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/clearMessages', methods=['GET', 'POST'])
def clearMessages():
    try:
        conn, cursor = get_db()
        
       
        cursor.execute("SELECT COUNT(*) as count FROM rep_connect_messages")
        count_result = cursor.fetchone()
        deleted_count = count_result["count"] if count_result else 0
        
        
        cursor.execute("TRUNCATE TABLE rep_connect_messages")
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success", 
            "message": f"All {deleted_count} messages cleared successfully",
            "deleted_count": deleted_count
        }), 200
    except Exception as e:
        print(f"Error clearing messages: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<int:message_id>/read', methods=['PUT'])
def updateMessageReadStatus(message_id):
    try:
        data = request.get_json()
        
        if not data or 'is_read' not in data:
            return jsonify({'error': 'Missing is_read field'}), 400
        
        conn, cursor = get_db()
        
        
        cursor.execute("SELECT id FROM rep_connect_messages WHERE id = %s", (message_id,))
        message = cursor.fetchone()
        
        if not message:
            conn.close()
            return jsonify({"error": "Message not found"}), 404
        
       
        cursor.execute("UPDATE rep_connect_messages SET is_read = %s WHERE id = %s", 
                      (bool(data['is_read']), message_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": f"Message {message_id} read status updated",
            "is_read": bool(data['is_read'])
        }), 200
    except Exception as e:
        print(f"Error updating message {message_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/stats', methods=['GET'])
def getMessageStats():
    try:
        conn, cursor = get_db()
        
        # Total messages
        cursor.execute("SELECT COUNT(*) as total FROM rep_connect_messages")
        total = cursor.fetchone()["total"]
        
       
        cursor.execute("SELECT COUNT(*) as unread FROM rep_connect_messages WHERE is_read = FALSE OR is_read = 0")
        unread = cursor.fetchone()["unread"]
        
       
        cursor.execute("""
            SELECT COUNT(*) as today 
            FROM rep_connect_messages 
            WHERE DATE(timestamp) = CURDATE()
        """)
        today = cursor.fetchone()["today"]
        
        conn.close()
        
        return jsonify({
            "total": total,
            "unread": unread,
            "today": today,
            "read": total - unread
        }), 200
    except Exception as e:
        print(f"Error fetching stats: {e}")
        return jsonify({'error': str(e)}), 500




@app.route('/api/addEvent', methods=['GET', 'POST'])
def addEvent():
    try:
        event_name = request.form.get('event_name')
        event_date = request.form.get('event_date')
        event_time = request.form.get('event_time')
        event_desc = request.form.get('event_desc')
        conn, cursor = get_db()
        cursor.execute("INSERT INTO events (event_name, event_date, event_time, event_desc) VALUES (%s,%s,%s,%s)", (event_name, event_date, event_time, event_desc))
        conn.commit()
        conn.close()
        return jsonify({"status":"success"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/getEvent', methods=['GET', 'POST'])
def getEvent():
    conn, cursor = get_db()
    cursor.execute("SELECT * FROM events")
    events = cursor.fetchall()
    evt_list = []
    for e in events:
        evt_list.append({
            'id': e['id'],
            'event_name': e['event_name'],
            'event_desc': e['event_desc'],
            'event_time': e['event_time'],
            'event_date': str(e['event_date'])
        })
    conn.close()
    return jsonify(evt_list)

@app.route('/api/editEvent/<int:event_id>', methods=['PUT'])
def editEvent(event_id):
    try:
        conn, cursor = get_db()
        
       
        cursor.execute("SELECT * FROM events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        
        if not event:
            conn.close()
            return jsonify({'error': 'Event not found'}), 404
        
       
        event_name = request.form.get('event_name')
        event_desc = request.form.get('event_desc')
        event_time = request.form.get('event_time')
        event_date = request.form.get('event_date')
        
       
        if not event_name or not event_date:
            conn.close()
            return jsonify({'error': 'Event name and date are required'}), 400
        
     
        cursor.execute("""
            UPDATE events 
            SET event_name = %s, event_desc = %s, event_time = %s, event_date = %s 
            WHERE id = %s
        """, (event_name, event_desc, event_time, event_date, event_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Event updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/deleteEvent/<int:event_id>', methods=['DELETE'])
def deleteEvent(event_id):
    try:
        conn, cursor = get_db()
        
       
        cursor.execute("SELECT * FROM events WHERE id = %s", (event_id,))
        event = cursor.fetchone()
        
        if not event:
            conn.close()
            return jsonify({'error': 'Event not found'}), 404
        
      
        cursor.execute("DELETE FROM events WHERE id = %s", (event_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Event deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500




HF_API_TOKEN = 'Removed for security reasons'  
HF_HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}


ZERO_SHOT_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

def simple_keyword_categorization(question, response, predefined_categories):
    
    try:
       
        response_clean = response.lower().strip()
        
       
        corpus = [response_clean] + [cat.lower() for cat in predefined_categories]
        
       
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
       
        response_vec = tfidf_matrix[0:1]
        category_vecs = tfidf_matrix[1:]
        similarities = cosine_similarity(response_vec, category_vecs)[0]
        
       
        best_idx = np.argmax(similarities)
        
       
        if similarities[best_idx] < 0.1:
            return "other"
        
        return predefined_categories[best_idx]
        
    except Exception as e:
        print(f"Keyword categorization error: {str(e)}")
        return "other"

def generate_categories_from_question(question, num_categories=5):
   
    try:
        question_lower = question.lower()
        category_map = {
            
            'election': ['economy', 'healthcare', 'infrastructure', 'education', 'public safety', "foreign policy"],
            'issue': ['infrastructure', 'healthcare', 'economy', 'education', 'environment'],
            'problem': ['infrastructure', 'service quality', 'cost', 'accessibility', 'safety'],
            'concern': ['safety', 'cost', 'quality', 'access', 'environment'],
            
            
            'like': ['yes', 'no', 'maybe', 'depends'],
            'prefer': ['option A', 'option B', 'option C', 'no preference'],
            'favorite': ['first choice', 'second choice', 'third choice'],
            'color': ['red', 'blue', 'green', 'yellow', 'orange'],
            
           
            'improve': ['service', 'quality', 'speed', 'cost', 'communication'],
            'change': ['process', 'policy', 'system', 'approach', 'communication'],
            'better': ['quality', 'service', 'pricing', 'features', 'support'],
            
           
            'think': ['positive', 'negative', 'neutral', 'mixed'],
            'feel': ['satisfied', 'dissatisfied', 'neutral', 'mixed'],
            'opinion': ['agree', 'disagree', 'neutral', 'unsure'],
        }
        
       
        for keyword, categories in category_map.items():
            if keyword in question_lower:
                result = categories[:num_categories-1]  
                result.append('other')
                return result
        
       
        return ['response type 1', 'response type 2', 'response type 3', 'response type 4', 'other'][:num_categories]
        
    except Exception as e:
        print(f"Category generation error: {str(e)}")
        return ['category 1', 'category 2', 'category 3', 'other']

def categorize_response_to_options(response_text, category_options):
    
    
    try:
        payload = {
            "inputs": response_text,
            "parameters": {
                "candidate_labels": category_options,
                "multi_label": False
            }
        }
        
        response = requests.post(ZERO_SHOT_URL, headers=HF_HEADERS, json=payload, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            return result["labels"][0]
    except Exception as e:
        print(f"HF API failed, using fallback: {str(e)}")
    
    
    return simple_keyword_categorization("", response_text, category_options)

@app.route('/api/getPolls', methods=['GET'])
def getPolls():
    conn,cursor = get_db()
    cursor.execute("SELECT * FROM polls WHERE is_active =%s", (True,))
    polls = cursor.fetchall()
    poll_list = []
    for poll in polls:
        poll_list.append({
            'id': poll['id'],
            'title': poll['title'],
            'poll_type': poll['poll_type'],
            'created_at': poll['created_at'],
            'expires_at':poll['expires_at']
        })
    conn.close()
    return jsonify(poll_list)

@app.route('/api/deletePoll/<int:poll_id>', methods=['DELETE'])
def deletePoll(poll_id):
    try:
        conn, cursor = get_db()
        
        
        cursor.execute("SELECT * FROM polls WHERE id = %s", (poll_id,))
        poll = cursor.fetchone()
        
        if not poll:
            conn.close()
            return jsonify({'error': 'Poll not found'}), 404
        
      
        cursor.execute("DELETE FROM polls WHERE id = %s", (poll_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Poll deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/getPollOptions/<int:poll_id>', methods=['GET'])
def getPollOptions(poll_id):
    try:
        conn, cursor = get_db()
    
        cursor.execute("SELECT poll_type FROM polls WHERE id = %s", (poll_id,))
        poll = cursor.fetchone()
        
        if not poll:
            conn.close()
            return jsonify({'error': 'Poll not found'}), 404
        
        poll_type = poll['poll_type']
        
      
        cursor.execute("""
            SELECT id, option_text, option_order 
            FROM poll_options 
            WHERE poll_id = %s 
            ORDER BY option_order
        """, (poll_id,))
        
        options = cursor.fetchall()
        conn.close()
        
        option_list = []
        for opt in options:
            option_list.append({
                'id': opt['id'],
                'text': opt['option_text'],
                'order': opt['option_order']
            })
        
        return jsonify({
            'poll_type': poll_type,
            'options': option_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/expirePoll/<int:poll_id>', methods=['PUT'])
def expirePoll(poll_id):
    try:
        conn, cursor = get_db()
        
       
        cursor.execute("SELECT * FROM polls WHERE id = %s", (poll_id,))
        poll = cursor.fetchone()
        
        if not poll:
            conn.close()
            return jsonify({'error': 'Poll not found'}), 404
        
       
        data = request.get_json()
        expires_at = data.get('expires_at')
        
        if not expires_at:
            conn.close()
            return jsonify({'error': 'expires_at is required'}), 400
        
      
        cursor.execute("UPDATE polls SET expires_at = %s WHERE id = %s", (expires_at, poll_id))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Poll expiration updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/addPolls', methods=['GET', 'POST'])
def addPolls():
    try:
        title = request.form.get('title')
        poll_type = request.form.get('poll_type')
        expires_at = request.form.get('expires_at')
        if expires_at == '':
            expires_at = None
        
        conn, cursor = get_db()
        
     
        cursor.execute("INSERT INTO polls (title, poll_type, expires_at) VALUES (%s, %s, %s) RETURNING id", 
                      (title, poll_type, expires_at))
        poll_id = cursor.fetchone()['id']
        
       
        if poll_type == 'yes_no':
            cursor.execute("INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                          (poll_id, 'Yes', 1))
            cursor.execute("INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                          (poll_id, 'No', 2))
        elif poll_type == 'yes_no_maybe':
            cursor.execute("INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                          (poll_id, 'Yes', 1))
            cursor.execute("INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                          (poll_id, 'No', 2))
            cursor.execute("INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                          (poll_id, 'Maybe', 3))
        elif poll_type == 'short_answer':
            try:
                categories = generate_categories_from_question(title, num_categories=6)
                for idx, category in enumerate(categories, start=1):
                    cursor.execute(
                        "INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                        (poll_id, category, idx)
                    )
                print(f"Generated categories for poll '{title}': {categories}")
            except Exception as e:
                print(f"Error generating categories: {str(e)}")
                cursor.execute("INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (%s, %s, %s)", 
                              (poll_id, 'other', 1))
        
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'poll_id': poll_id}), 200
    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/api/pollResponse/<int:poll_id>/', methods=['POST'])
def pollResponse(poll_id):
    try:
        data = request.get_json()
        selected_option_id = data.get('selected_option_id')
        text_response = data.get('text_response')
        
    
        if not selected_option_id and not text_response:
            return jsonify({'error': 'Must provide either selected_option_id or text_response'}), 400
        
        conn, cursor = get_db()
        
        category = None
        
      
        if text_response:
            cursor.execute("SELECT title, poll_type FROM polls WHERE id = %s", (poll_id,))
            poll = cursor.fetchone()
            
            if poll and poll['poll_type'] == 'short_answer':
                try:
                    cursor.execute("""
                        SELECT option_text 
                        FROM poll_options 
                        WHERE poll_id = %s 
                        ORDER BY option_order
                    """, (poll_id,))
                    
                    category_options = [row['option_text'] for row in cursor.fetchall()]
                    
                    if category_options:
                        category = categorize_response_to_options(text_response, category_options)
                        print(f"Response '{text_response}' categorized as: {category}")
                    else:
                        category = "other"
                    
                except Exception as e:
                    print(f"AI categorization error: {str(e)}")
                    category = "other"
        
        cursor.execute("INSERT INTO poll_responses (poll_id, selected_option_id, text_response, category) VALUES (%s, %s, %s, %s)", 
                      (poll_id, selected_option_id, text_response, category))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'category': category
        }), 200
        
    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/getPollResponse/<int:poll_id>/', methods=['GET'])
def getPollResponse(poll_id):
    conn = None
    cursor = None
    
    try:
        if poll_id <= 0:
            return jsonify({"error": "Invalid poll ID"}), 400
        
        conn, cursor = get_db()
        
    
        cursor.execute('SELECT poll_type FROM polls WHERE id = %s', (poll_id,))
        poll_result = cursor.fetchone()
        
        if not poll_result:
            return jsonify({"error": "Poll not found"}), 404
        
       
        if isinstance(poll_result, dict):
            poll_type = poll_result['poll_type']
        else:
            poll_type = poll_result[0]
        
      
        
       
        cursor.execute("""
            SELECT pr.id, pr.selected_option_id, pr.text_response, pr.category, pr.created_at,
                   po.option_text
            FROM poll_responses pr
            LEFT JOIN poll_options po ON pr.selected_option_id = po.id
            WHERE pr.poll_id = %s
            ORDER BY pr.created_at DESC
        """, (poll_id,))
        
        responses = cursor.fetchall()
        
        
        if not responses:
            return jsonify([])  
        
        resp_list = []
        for resp in responses:
            if isinstance(resp, dict):
                response_id = resp['id']
                selected_option_id = resp['selected_option_id']
                text_response = resp['text_response']
                category = resp.get('category')
                created_at = resp['created_at']
                option_text = resp.get('option_text')
            else:
                response_id = resp[0]
                selected_option_id = resp[1]
                text_response = resp[2]
                category = resp[3]
                created_at = resp[4]
                option_text = resp[5] if len(resp) > 5 else None
            

            
          
            if poll_type in ['yes_no', 'yes_no_maybe']:
                if selected_option_id is not None:
                    answer = option_text if option_text else f"Option {selected_option_id}"
                else:
                    answer = "No selection"
                
                resp_list.append({
                    'id': response_id,
                    'answer': answer,
                    'created_at': str(created_at)
                })
            else:  
                answer = category if category else "Uncategorized"
                
                resp_list.append({
                    'id': response_id,
                    'answer': answer, 
                    'text_response': text_response, 
                    'created_at': str(created_at)
                })
        
        
        return jsonify(resp_list)
        
    except Exception as e:
        print(f"Error in getPollResponse: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
        
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=8000)