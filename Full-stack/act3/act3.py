print(">>>Se esta ejecutando app.py")
from flask import Flask, request, jsonify


app = Flask(__name__)

users = []
tareas = []

@app.route('/users', methods=['POST'])
def create_user():
    data= request.get_json()

    user = {
        "id": len(users) + 1,
        "name": data["name"],
        "email": data["email"]
    }

    users.append(user)

    return jsonify({
        "message": "Usuario creado correctamente",
        "user":user
    }), 201

@app.route('/tareas', methods=['POST'])
def create_tarea():
    data = request.get_json()

    tarea= {
        "id": len(tareas) + 1,
        "titulo": data["titulo"],
        "descripcion": data["descripcion"]
    }

    tareas.append(tarea)

    return jsonify({
        "message": "tarea agregada exitosamente",
        "Tarea:": tarea
    }), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
