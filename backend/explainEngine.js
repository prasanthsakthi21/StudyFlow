function explainCode(code) {
    let explanation = [];
    let detectedLanguage = "Unknown";
    let concepts = new Set();
    let complexity = "O(1)"; // Default

    // 1. Language Detection & Syntax Specifics
    if (code.includes("#include") || code.includes("printf") || code.includes("std::cout")) {
        detectedLanguage = "C / C++";
    } else if (code.includes("public static void main") || code.includes("System.out.println")) {
        detectedLanguage = "Java";
    } else if (code.includes("def ") || (code.trim().startsWith("import") && !code.includes(";"))) {
        detectedLanguage = "Python";
    } else if (code.includes("console.log") || code.includes("function") || code.includes("const ") || code.includes("let ")) {
        detectedLanguage = "JavaScript";
    } else if (code.includes("SELECT") && code.includes("FROM")) {
        detectedLanguage = "SQL";
    } else {
        // Fallback checks
        if (code.includes("var ") || code.includes("===")) detectedLanguage = "JavaScript";
        if (code.includes("class ") && code.includes(":")) detectedLanguage = "C++"; // Loose
    }

    // 2. Complexity Analysis (Heuristic Support)
    const lines = code.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;
    let hasLogarithmic = false;
    let isRecursive = false;

    // First pass for global traits
    const funcNames = new Set();
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.includes("function") || trimmed.includes("def ")) {
            const name = trimmed.split(' ')[1]?.split('(')[0];
            if (name) funcNames.add(name);
        }
    });

    lines.forEach(line => {
        const trimmed = line.trim();
        // Increase nesting
        if (trimmed.includes("for") || trimmed.includes("while") || trimmed.endsWith("{")) {
            if (trimmed.includes("for") || trimmed.includes("while")) {
                currentNesting++;
            }
        }
        // Decrease nesting
        if (trimmed.includes("}")) {
            if (currentNesting > 0) currentNesting--;
        }

        // Logarithmic checks
        if (trimmed.includes("/= 2") || trimmed.includes(">> 1") || trimmed.includes("binarySearch")) {
            hasLogarithmic = true;
        }

        // Recursion check
        funcNames.forEach(name => {
            if (trimmed.includes(name + "(") && !trimmed.includes("function") && !trimmed.includes("def ")) {
                isRecursive = true;
            }
        });

        if (currentNesting > maxNesting) maxNesting = currentNesting;
    });

    if (isRecursive) {
        complexity = "O(2^n) or O(n)"; // Generic recursion guessing
        concepts.add("Recursion");
    } else if (maxNesting === 0) {
        complexity = "O(1)";
    } else if (maxNesting === 1) {
        complexity = hasLogarithmic ? "O(log n)" : "O(n)";
    } else if (maxNesting === 2) {
        complexity = "O(n²)";
    } else if (maxNesting >= 3) {
        complexity = "O(n³)";
    }

    // 3. Line-by-Line Analysis (Improved)
    const detailedExplanation = lines.map((line, index) => {
        let content = line.trim();
        // IGNORE: Empty lines, pure comments, closers
        if (!content || content.length < 2 || content.startsWith("//") || content.startsWith("#") || content === "}" || content === "{") return null;

        let lineText = "Executes specific logic.";

        // --- Heuristic Rules ---

        // Variables
        if (content.match(/^(int|float|double|char|boolean|var|let|const|val)\s/)) {
            const varMatch = content.match(/^(?:int|float|double|char|boolean|var|let|const|val)\s+([a-zA-Z0-9_]+)/);
            const varName = varMatch ? varMatch[1] : "variable";
            lineText = `Initializes '${varName}', setting aside memory for it.`;
            concepts.add("Variables");
        }
        // Loops
        else if (content.includes("for") || content.includes("while")) {
            if (content.includes("for")) {
                lineText = "Starts a loop that will run a specific number of times (Iteration).";
            }
            else {
                lineText = "Starts a loop that continues as long as the condition is true.";
            }
            concepts.add("Loops");
        }
        // Conditionals
        else if (content.startsWith("if") || content.includes(" if ")) {
            lineText = "Checks a logical condition to decide the next step.";
            concepts.add("Conditionals");
        }
        else if (content.includes("else")) {
            lineText = "Alternative path taken if the previous 'if' condition failed.";
        }
        // Arrays / Lists
        else if (content.includes("[") && content.includes("]")) {
            if (content.includes("=")) lineText = "Updates data at a specific position in the list/array.";
            else lineText = "Accesses data from the structural collection.";
            concepts.add("Data Structures");
        }
        // Functions
        else if (content.includes("function") || content.startsWith("def ") || content.includes("void ")) {
            const funcName = content.split(' ')[1]?.split('(')[0] || "function";
            lineText = `Defines a reusable block of code named '${funcName}'.`;
            concepts.add("Functions");
        }
        // Returns
        else if (content.includes("return")) {
            lineText = "Ends the function and sends the result back.";
        }
        // Output
        else if ((content.includes("print") || content.includes("console.log") || content.includes("System.out")) && !content.includes("private")) {
            lineText = "Outputs the current value/state to the screen.";
        }
        // Swapping (Common in sorting)
        else if (content.includes("temp") && content.includes("=")) {
            lineText = "Uses a temporary variable, likely for swapping values.";
            concepts.add("Swapping");
        }
        // Math / Increment
        else if (content.match(/[\+\-\*\/%]=?/)) {
            if (content.includes("++") || content.includes("--") || content.includes("+= 1")) lineText = "Updates the counter variable.";
            else lineText = "Performs a mathematical calculation.";
        }
        // Classes
        else if (content.includes("class ")) {
            const className = content.split('class ')[1]?.split(' ')[0] || "Entity";
            lineText = `Defines a new type of object: '${className}'.`;
            concepts.add("OOP");
        }
        // Assignments
        else if (content.includes("=")) {
            lineText = "Updates the variable with a new value.";
        }
        // Function Calls
        else if (content.includes("(") && content.includes(")")) {
            lineText = "Calls another function to perform a task.";
        }

        return { line: `Line ${index + 1}`, text: lineText };
    }).filter(item => item !== null);

    return {
        language: detectedLanguage,
        explanation: detailedExplanation,
        complexity: complexity,
        concepts: Array.from(concepts)
    };
}

module.exports = explainCode;
