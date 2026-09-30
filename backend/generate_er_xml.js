const fs = require('fs');

const createErXml = () => {
    // Entities and their attributes based on the schema analysis
    const tables = [
        {
            name: "users",
            cols: [
                "+ id: INT (PK)",
                "full_name: VARCHAR",
                "email: VARCHAR",
                "password_hash: VARCHAR",
                "role: ENUM",
                "avatar_url: TEXT",
                "credits: INT",
                "created_at: TIMESTAMP"
            ],
            x: 40, y: 40, w: 200, h: 220
        },
        {
            name: "files",
            cols: [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "public_id: VARCHAR",
                "file_type: VARCHAR",
                "file_url: TEXT",
                "original_name: VARCHAR",
                "file_size: BIGINT",
                "subject: VARCHAR",
                "approval_status: ENUM",
                "related_video_url: TEXT",
                "created_at: TIMESTAMP"
            ],
            x: 300, y: 40, w: 220, h: 260
        },
        {
            name: "micro_lessons",
            cols: [
                "+ id: INT (PK)",
                "# file_id: INT (FK)",
                "lesson_order: INT",
                "title: VARCHAR",
                "content_points: JSON",
                "duration_seconds: INT",
                "audio_url: TEXT",
                "created_at: TIMESTAMP"
            ],
            x: 600, y: 40, w: 200, h: 200
        },
        {
            name: "lesson_progress",
            cols: [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "# file_id: INT (FK)",
                "last_lesson_index: INT",
                "updated_at: TIMESTAMP"
            ],
            x: 40, y: 300, w: 200, h: 140
        },
        {
            name: "career_analysis",
            cols: [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "skills: TEXT",
                "interests: TEXT",
                "academics: TEXT",
                "result_json: JSON",
                "created_at: TIMESTAMP"
            ],
            x: 40, y: 480, w: 200, h: 180
        },
        {
            name: "quizzes",
            cols: [
                "+ id: INT (PK)",
                "# created_by: INT (FK)",
                "title: VARCHAR",
                "course: VARCHAR",
                "difficulty_level: ENUM",
                "created_at: TIMESTAMP"
            ],
            x: 300, y: 350, w: 200, h: 160
        },
        {
            name: "questions",
            cols: [
                "+ id: INT (PK)",
                "# quiz_id: INT (FK)",
                "question_text: TEXT",
                "question_type: ENUM",
                "marks: INT"
            ],
            x: 600, y: 350, w: 200, h: 140
        },
        {
            name: "options",
            cols: [
                "+ id: INT (PK)",
                "# question_id: INT (FK)",
                "option_text: TEXT",
                "is_correct: BOOLEAN"
            ],
            x: 600, y: 550, w: 200, h: 120
        },
        {
            name: "quiz_results",
            cols: [
                "+ id: INT (PK)",
                "# user_id: INT (FK)",
                "# quiz_id: INT (FK)",
                "score: INT",
                "total_marks: INT",
                "attempted_at: TIMESTAMP"
            ],
            x: 300, y: 550, w: 220, h: 160
        },
        {
            name: "code_lessons",
            cols: [
                "+ id: INT (PK)",
                "language: VARCHAR",
                "snippet: TEXT",
                "explanation: TEXT",
                "complexity: VARCHAR",
                "created_at: TIMESTAMP"
            ],
            x: 40, y: 700, w: 200, h: 160
        }
    ];

    // Build XML string manually
    let xml = '<mxfile host="app.diagrams.net">\n';
    xml += '  <diagram name="StudyFlow ER Diagram">\n';
    xml += '    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">\n';
    xml += '      <root>\n';
    xml += '        <mxCell id="0" />\n';
    xml += '        <mxCell id="1" parent="0" />\n';

    let tableMap = {}; // Name to ID
    let currentId = 2;

    tables.forEach((t) => {
        let tId = currentId++;
        tableMap[t.name] = tId;

        // Table Header
        xml += `        <mxCell id="${tId}" value="${t.name}" style="swimlane;fontStyle=1;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;" parent="1" vertex="1">\n`;
        xml += `          <mxGeometry x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" as="geometry" />\n`;
        xml += `        </mxCell>\n`;

        // Columns
        t.cols.forEach((col) => {
            let cId = currentId++;
            // Check for PK or FK to add icons (implied by text for now)
            let style = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;";
            xml += `        <mxCell id="${cId}" value="${col}" style="${style}" parent="${tId}" vertex="1">\n`;
            xml += `          <mxGeometry y="26" width="${t.w}" height="26" as="geometry" />\n`;
            xml += `        </mxCell>\n`;
        });
    });

    // Relationships (Manual for simplicity based on ID references)
    const relationships = [
        { from: "users", to: "files" },
        { from: "users", to: "quizzes" },
        { from: "users", to: "quiz_results" },
        { from: "users", to: "career_analysis" },
        { from: "users", to: "lesson_progress" },
        { from: "files", to: "micro_lessons" },
        { from: "files", to: "lesson_progress" },
        { from: "quizzes", to: "questions" },
        { from: "questions", to: "options" },
        { from: "quizzes", to: "quiz_results" }
    ];

    relationships.forEach((rel) => {
        if (tableMap[rel.from] && tableMap[rel.to]) {
            let rId = currentId++;
            // Crow's foot notation style
            // StartArrow=ERone means "One" side
            // EndArrow=ERmany means "Many" side
            let style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=ERmany;startArrow=ERone;startFill=0;";
            xml += `        <mxCell id="${rId}" style="${style}" parent="1" source="${tableMap[rel.from]}" target="${tableMap[rel.to]}" edge="1">\n`;
            xml += `          <mxGeometry relative="1" as="geometry" />\n`;
            xml += `        </mxCell>\n`;
        }
    });

    xml += '      </root>\n';
    xml += '    </mxGraphModel>\n';
    xml += '  </diagram>\n';
    xml += '</mxfile>';

    return xml;
};

fs.writeFileSync('er_diagram.xml', createErXml());
console.log('XML generated in er_diagram.xml');
