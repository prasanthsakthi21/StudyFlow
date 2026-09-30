import xml.etree.ElementTree as ET

def create_er_xml():
    mxfile = ET.Element('mxfile', host="app.diagrams.net")
    diagram = ET.SubElement(mxfile, 'diagram', name="StudyFlow ER Diagram")
    model = ET.SubElement(diagram, 'mxGraphModel', dx="1422", dy="762", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="850", pageHeight="1100", math="0", shadow="0")
    root = ET.SubElement(model, 'root')
    
    ET.SubElement(root, 'mxCell', id="0")
    ET.SubElement(root, 'mxCell', id="1", parent="0")
    
    tables = [
        {
            "name": "users",
            "cols": [
                "+ id: INT (PK)",
                "full_name: VARCHAR",
                "email: VARCHAR",
                "password_hash: VARCHAR",
                "role: ENUM",
                "avatar_url: TEXT",
                "created_at: TIMESTAMP",
                "credits: INT"
            ],
            "x": 360, "y": 40, "w": 200, "h": 220
        },
        {
            "name": "files",
            "cols": [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "public_id: VARCHAR",
                "uploaded_by: ENUM",
                "file_type: VARCHAR",
                "file_url: TEXT",
                "secure_url: TEXT",
                "original_name: VARCHAR",
                "file_size: BIGINT",
                "approval_status: ENUM",
                "subject: VARCHAR",
                "course: VARCHAR",
                "semester: VARCHAR",
                "unit_number: VARCHAR",
                "topic_name: VARCHAR",
                "difficulty_level: ENUM",
                "category: ENUM",
                "description: TEXT",
                "created_at: TIMESTAMP",
                "related_video_url: TEXT"
            ],
            "x": 40, "y": 40, "w": 240, "h": 520
        },
        {
            "name": "micro_lessons",
            "cols": [
                "+ id: INT (PK)",
                "# file_id: INT (FK)",
                "lesson_order: INT",
                "title: VARCHAR",
                "content_points: JSON",
                "duration_seconds: INT",
                "audio_url: TEXT",
                "created_at: TIMESTAMP"
            ],
            "x": 40, "y": 600, "w": 180, "h": 210
        },
        {
            "name": "lesson_progress",
            "cols": [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "# file_id: INT (FK)",
                "last_lesson_index: INT",
                "updated_at: TIMESTAMP"
            ],
            "x": 260, "y": 600, "w": 200, "h": 150
        },
        {
            "name": "career_assessments",
            "cols": [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "skills: TEXT",
                "interests: TEXT",
                "academics: TEXT",
                "result_json: JSON",
                "created_at: TIMESTAMP"
            ],
            "x": 600, "y": 40, "w": 200, "h": 190
        },
        {
            "name": "quizzes",
            "cols": [
                "+ id: INT (PK)",
                "# created_by: INT (FK)",
                "title: VARCHAR",
                "description: TEXT",
                "course: VARCHAR",
                "semester: VARCHAR",
                "subject: VARCHAR",
                "unit_number: VARCHAR",
                "topic_name: VARCHAR",
                "difficulty_level: ENUM",
                "created_at: TIMESTAMP"
            ],
            "x": 600, "y": 260, "w": 200, "h": 280
        },
        {
            "name": "questions",
            "cols": [
                "+ id: INT (PK)",
                "# quiz_id: INT (FK)",
                "question_text: TEXT",
                "question_type: ENUM",
                "marks: INT"
            ],
            "x": 600, "y": 580, "w": 200, "h": 150
        },
        {
            "name": "options",
            "cols": [
                "+ id: INT (PK)",
                "# question_id: INT (FK)",
                "option_text: TEXT",
                "is_correct: BOOLEAN"
            ],
            "x": 600, "y": 770, "w": 200, "h": 120
        },
        {
            "name": "quiz_results",
            "cols": [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "# quiz_id: INT (FK)",
                "score: INT",
                "total_marks: INT",
                "attempted_at: TIMESTAMP"
            ],
            "x": 840, "y": 260, "w": 200, "h": 180
        },
        {
            "name": "code_lessons",
            "cols": [
                "+ id: INT (PK)",
                "language: VARCHAR",
                "snippet: TEXT",
                "explanation: TEXT",
                "complexity: VARCHAR",
                "created_at: TIMESTAMP"
            ],
            "x": 360, "y": 800, "w": 200, "h": 180
        }
    ]

    relationships = [
        {"from": "users", "to": "files", "label": "uploads (1:N)"},
        {"from": "users", "to": "quizzes", "label": "creates (1:N)"},
        {"from": "users", "to": "quiz_results", "label": "attempts (1:N)"},
        {"from": "users", "to": "career_assessments", "label": "has (1:N)"},
        {"from": "users", "to": "lesson_progress", "label": "tracks (1:N)"},
        {"from": "files", "to": "micro_lessons", "label": "contains (1:N)"},
        {"from": "files", "to": "lesson_progress", "label": "tracked_in (1:N)"},
        {"from": "quizzes", "to": "questions", "label": "has (1:N)"},
        {"from": "quizzes", "to": "quiz_results", "label": "recorded_in (1:N)"},
        {"from": "questions", "to": "options", "label": "has (1:N)"}
    ]

    # Helper to find ID by name
    ids = { name: str(i+2) for i, name in enumerate([t["name"] for t in tables]) }
    current_id = len(tables) + 2

    # Draw Tables
    for table in tables:
        t_id = ids[table["name"]]
        style = "swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;"
        cell = ET.SubElement(root, 'mxCell', id=t_id, value=table["name"], parent="1", vertex="1", style=style)
        geometry = ET.SubElement(cell, 'mxGeometry', x=str(table["x"]), y=str(table["y"]), width=str(table["w"]), height=str(table["h"]),  as_="geometry")
        
        # Add Columns
        for i, col in enumerate(table["cols"]):
            col_id = f"{t_id}_{i}"
            col_style = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
            col_cell = ET.SubElement(root, 'mxCell', id=col_id, value=col, parent=t_id, vertex="1", style=col_style)
            ET.SubElement(col_cell, 'mxGeometry', y=str(26 + i*26), width=str(table["w"]), height="26", as_="geometry")

    # Draw Relationships
    for rel in relationships:
        src_id = ids[rel["from"]]
        target_id = ids[rel["to"]]
        rel_id = str(current_id)
        current_id += 1
        
        style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;exitX=0.5;exitY=1;exitDx=0;exitDy=0;endArrow=none;startArrow=diamondThin;endSize=6;startSize=6;startFill=0;"
        # Adjust style for ONE-TO-MANY (Diamond at 1 side, standard at N side... or Crow's foot)
        # Using Crow's Foot: endArrow=block;startArrow=oval; (simplified)
        # Standard: One side (Circle/Line) -> Many side (Crow's foot)
        # draw.io style for 1:N -> startArrow=ERone;endArrow=ERmany;
        style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=ERmany;startArrow=ERone;startFill=0;"
        
        edge = ET.SubElement(root, 'mxCell', id=rel_id, value=rel.get("label", ""), parent="1", source=src_id, target=target_id, edge="1", style=style)
        ET.SubElement(edge, 'mxGeometry', relative="1", as_="geometry")

    return ET.tostring(mxfile, encoding='unicode')

if __name__ == "__main__":
    print(create_er_xml())
