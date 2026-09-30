

function converterEngine(code, targetLang) {
    let convertedCode = `// [Auto-Converted to ${targetLang}]\n\n`;

    // Detect Source Language (Simple)
    let sourceLang = "unknown";
    if (code.includes("def ") || code.includes("print(") || code.includes("import ")) sourceLang = "python";
    else if (code.includes("function") || code.includes("console.log") || code.includes("const ") || code.includes("let ")) sourceLang = "javascript";
    else if (code.includes("public class") || (code.includes("int ") && code.includes(";"))) sourceLang = "java_cpp";

    // Same Language Check
    if (sourceLang === targetLang) {
        return "// Source and Target languages are the same.\n" + code;
    }

    // --- PYTHON TO JAVASCRIPT ---
    if (sourceLang === 'python' && targetLang === 'javascript') {
        let jsCode = code
            .replace(/def\s+([a-zA-Z0-9_]+)\((.*)\):/g, "function $1($2) {")
            .replace(/print\((.*)\)/g, "console.log($1);")
            .replace(/if\s+(.*):/g, "if ($1) {")
            .replace(/else:/g, "else {")
            .replace(/elif\s+(.*):/g, "else if ($1) {")
            .replace(/for\s+(.*)\s+in\s+range\((.*)\):/g, "for (let $1 = 0; $1 < $2; $1++) {") // Better loop
            .replace(/True/g, "true")
            .replace(/False/g, "false")
            .replace(/None/g, "null")
            .replace(/#/g, "//")
            .replace(/and/g, "&&")
            .replace(/or/g, "||");

        // Indentation to Braces Heuristic (Naive)
        // We assume 4-space indentation for Python blocks
        const lines = jsCode.split('\n');
        let openBraces = 0;
        let resultLines = [];

        lines.forEach(line => {
            // If line ends with {, we increment count
            if (line.trim().endsWith('{')) openBraces++;

            // If we see a dedent (logic hard to perfect in regex), we might need closing brace
            // For now, we will just return the regex version and append a note
            resultLines.push(line);
        });

        convertedCode += resultLines.join('\n');
        convertedCode += "\n// Note: Check braces '{}' matching, as Python relies on indentation.";
    }

    // --- JAVASCRIPT TO PYTHON ---
    else if (sourceLang === 'javascript' && targetLang === 'python') {
        convertedCode += code
            .replace(/function\s+([a-zA-Z0-9_]+)\((.*)\)\s*\{/g, "def $1($2):")
            .replace(/console\.log\((.*)\);?/g, "print($1)")
            .replace(/if\s*\((.*)\)\s*\{/g, "if $1:")
            .replace(/\}?\s*else\s*\{/g, "else:")
            .replace(/\}?\s*else\s*if\s*\((.*)\)\s*\{/g, "elif $1:")
            .replace(/for\s*\((?:let|var)\s+(\w+)\s*=\s*0;\s*\w+\s*<\s*(\w+);\s*\w+\+\+\)\s*\{/g, "for $1 in range($2):") // Loop fix
            .replace(/true/g, "True")
            .replace(/false/g, "False")
            .replace(/null/g, "None")
            .replace(/\/\//g, "#")
            .replace(/&&/g, "and")
            .replace(/\|\|/g, "or")
            .replace(/;/g, "")
            .replace(/\{/g, "")
            .replace(/\}/g, ""); // Remove braces
    }

    // --- GENERIC TO PYTHON (Fallback) ---
    else if (targetLang === 'python') {
        convertedCode = "# [Auto-Converted to Python]\n\n";
        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Basic Syntax Cleanup
            processed = processed.replace(/;/g, "")
                .replace(/\{/g, "")
                .replace(/\}/g, "")
                .replace(/\/\//g, "#");

            // 2. Control Structures
            if (processed.includes("function ")) {
                processed = processed.replace(/function\s+([a-zA-Z0-9_]+)\((.*)\).*/, "def $1($2):");
            } else if (processed.startsWith("if ") || processed.startsWith("else if")) {
                processed = processed.replace(/if\s*\((.*)\)/, "if $1:")
                    .replace(/else\s*if\s*\((.*)\)/, "elif $1:");
            } else if (processed.startsWith("else")) {
                processed = "else:";
            } else if (processed.startsWith("for ")) {
                // Try to handle C-style for loops generic conversion
                // for (int i=0; i<10; i++) -> for i in range(10):
                // This is hard to regex perfectly, but we can try a best guess
                if (processed.includes("<")) {
                    let limit = processed.match(/<\s*(\w+|\d+)/);
                    if (limit) processed = `for i in range(${limit[1]}):`;
                }
            } else if (processed.startsWith("while ")) {
                processed = processed.replace(/while\s*\((.*)\)/, "while $1:");
            }

            // 3. Print
            processed = processed.replace(/console\.log\((.*)\)/g, "print($1)");
            processed = processed.replace(/System\.out\.println\((.*)\)/g, "print($1)");
            processed = processed.replace(/fmt\.Println\((.*)\)/g, "print($1)");

            // 4. Variables
            // Remove var/let/const/int/double/String types
            processed = processed.replace(/^(?:var|let|const|int|double|String|bool|float)\s+/, "");

            convertedCode += processed + "\n";
        });
    }

    // --- GENERIC TO JAVASCRIPT (Fallback) ---
    else if (targetLang === 'javascript') {
        convertedCode = "// [Auto-Converted to JavaScript]\n\n";
        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Control Structures
            if (processed.startsWith("def ")) {
                processed = processed.replace(/def\s+([a-zA-Z0-9_]+)\((.*)\):/, "function $1($2) {");
            } else if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if ($1) {")
                    .replace(/elif\s+(.*):/, "else if ($1) {");
            } else if (processed.startsWith("else:")) {
                processed = "else {";
            } else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+(\w+)\s+in\s+range\((.*)\):/, "for (let $1 = 0; $1 < $2; $1++) {");
            } else if (processed.startsWith("while ")) {
                processed = processed.replace(/while\s+(.*):/, "while ($1) {");
            }

            // 2. Print Replacements (More robust)
            processed = processed.replace(/print\((.*)\)/g, "console.log($1);");
            processed = processed.replace(/System\.out\.println\((.*)\)/g, "console.log($1);");
            processed = processed.replace(/fmt\.Println\((.*)\)/g, "console.log($1);");
            processed = processed.replace(/echo\s+(.*)/g, "console.log($1)");
            processed = processed.replace(/Console\.WriteLine\((.*)\)/g, "console.log($1);");

            // 3. Variable Declaration Cleanup (int x -> let x)
            if (processed.match(/^(?:int|float|double|String|bool|var)\s+/)) {
                processed = processed.replace(/^(?:int|float|double|String|bool|var)\s+/, "let ");
            }

            // 4. Syntax
            if (!processed.endsWith("{") && !processed.endsWith("}") && !processed.startsWith("//")) {
                if (!processed.endsWith(";")) processed += ";";
            }
            processed = processed.replace(/#/g, "//");

            convertedCode += processed + "\n";
        });
        convertedCode += "\n// Note: Manually verify closing braces '}'";
    }

    // --- TO JAVA (Best Effort) ---
    else if (targetLang === 'java') {
        convertedCode = "public class Main {\n    public static void main(String[] args) {\n";

        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Control Structures (If/Else/For/While)
            if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if ($1) {")
                    .replace(/elif\s+(.*):/, "else if ($1) {");
            }
            else if (processed.startsWith("else:")) {
                processed = "else {";
            }
            else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+(\w+)\s+in\s+range\((.*)\):/, "for (int $1 = 0; $1 < $2; $1++) {");
            }
            else if (processed.startsWith("while ")) {
                processed = processed.replace(/while\s+(.*):/, "while ($1) {");
            }

            // 2. Print & Return
            processed = processed.replace(/print\((.*)\)/g, "System.out.println($1);");
            processed = processed.replace(/console\.log\((.*)\)/g, "System.out.println($1);");
            processed = processed.replace(/std::cout\s*<<\s*(.*)\s*(<<\s*std::endl)?;?/g, "System.out.println($1);");
            if (processed.startsWith("return ")) {
                processed = processed + ";";
            }

            // 3. Variables & Types (Improved)
            if (processed.match(/^[a-zA-Z_]\w*\s*=\s*\d+$/)) {
                processed = "int " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*\d+\.\d+$/)) {
                processed = "double " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*["'].*["']$/)) {
                processed = "String " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*(true|false|True|False)$/)) {
                processed = "boolean " + processed.toLowerCase() + ";";
            } else if (!processed.endsWith(";") && !processed.endsWith("{") && !processed.endsWith("}") && !processed.startsWith("//")) {
                processed += ";";
            }

            // 4. Comments
            processed = processed.replace(/#/g, "//");

            convertedCode += "        " + processed + "\n";
        });

        convertedCode += "    }\n";

        // Attempt to convert functions outside main (Very basic)
        if (code.includes("def ") || code.includes("function ")) {
            convertedCode += "\n    // Converted Functions (Static for simplicity)\n";
            let functionBlock = code.match(/(?:def|function)\s+([a-zA-Z0-9_]+)\((.*)\).*/g);
            if (functionBlock) {
                functionBlock.forEach(f => {
                    let sig = f.replace(/(?:def|function)\s+([a-zA-Z0-9_]+)\((.*)\).*/, "public static void $1($2) {");
                    convertedCode += "    " + sig + "\n        // Logic needs manual verification\n    }\n";
                });
            }
        }
        convertedCode += "}";
    }

    // --- TO C++ (Best Effort) ---
    else if (targetLang === 'cpp') {
        convertedCode = "#include <iostream>\n#include <string>\n\nusing namespace std;\n\nint main() {\n";

        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Control Structures (If/Else/For/While)
            if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if ($1) {")
                    .replace(/elif\s+(.*):/, "else if ($1) {");
            }
            else if (processed.startsWith("else:")) {
                processed = "else {";
            }
            else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+(\w+)\s+in\s+range\((.*)\):/, "for (int $1 = 0; $1 < $2; $1++) {");
            }
            else if (processed.startsWith("while ")) {
                processed = processed.replace(/while\s+(.*):/, "while ($1) {");
            }

            // 2. Print & Return
            processed = processed.replace(/print\((.*)\)/g, "cout << $1 << endl;");
            processed = processed.replace(/console\.log\((.*)\)/g, "cout << $1 << endl;");
            processed = processed.replace(/System\.out\.println\((.*)\);/g, "cout << $1 << endl;");
            if (processed.startsWith("return ")) {
                processed = processed + ";";
            }

            // 3. Variables & Types (Improved)
            if (processed.match(/^[a-zA-Z_]\w*\s*=\s*\d+$/)) {
                processed = "int " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*\d+\.\d+$/)) {
                processed = "double " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*["'].*["']$/)) {
                processed = "string " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*(true|false|True|False)$/)) {
                processed = "bool " + processed.toLowerCase() + ";";
            } else if (!processed.endsWith(";") && !processed.endsWith("{") && !processed.endsWith("}") && !processed.includes("#include") && !processed.startsWith("//")) {
                processed += ";";
            }

            // 4. Comments
            processed = processed.replace(/#/g, "//");

            convertedCode += "    " + processed + "\n";
        });

        convertedCode += "    return 0;\n}";
    }

    // --- TO C# (Best Effort) ---
    else if (targetLang === 'csharp') {
        convertedCode = "using System;\n\nnamespace Converter {\n    class Program {\n        static void Main(string[] args) {\n";

        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Control Structures
            if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if ($1) {")
                    .replace(/elif\s+(.*):/, "else if ($1) {");
            } else if (processed.startsWith("else:")) {
                processed = "else {";
            } else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+(\w+)\s+in\s+range\((.*)\):/, "for (int $1 = 0; $1 < $2; $1++) {");
            } else if (processed.startsWith("while ")) {
                processed = processed.replace(/while\s+(.*):/, "while ($1) {");
            }

            // 2. Print
            processed = processed.replace(/print\((.*)\)/g, "Console.WriteLine($1);");
            processed = processed.replace(/console\.log\((.*)\)/g, "Console.WriteLine($1);");
            processed = processed.replace(/System\.out\.println\((.*)\);/g, "Console.WriteLine($1);");

            // 3. Variables
            if (processed.match(/^[a-zA-Z_]\w*\s*=\s*\d+$/)) {
                processed = "int " + processed + ";";
            } else if (processed.match(/^[a-zA-Z_]\w*\s*=\s*["'].*["']$/)) {
                processed = "string " + processed + ";";
            } else if (!processed.endsWith(";") && !processed.endsWith("{") && !processed.endsWith("}")) {
                processed += ";";
            }
            processed = processed.replace(/#/g, "//");
            convertedCode += "            " + processed + "\n";
        });
        convertedCode += "        }\n    }\n}";
    }

    // --- TO PHP (Best Effort) ---
    else if (targetLang === 'php') {
        convertedCode = "<?php\n\n";

        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // Variables (Start with $)
            processed = processed.replace(/([a-zA-Z_]\w*)\s*=/g, "$$$1 =");
            processed = processed.replace(/([a-zA-Z_]\w*)\s*\+/g, "$$$1 +"); // naive var replacement

            // 1. Control Structures
            if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if ($1) {")
                    .replace(/elif\s+(.*):/, "else if ($1) {");
            } else if (processed.startsWith("else:")) {
                processed = "else {";
            } else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+\$(\w+)\s+in\s+range\((.*)\):/, "for ($$1 = 0; $$1 < $2; $$1++) {");
            }

            // 2. Print
            processed = processed.replace(/print\((.*)\)/g, "echo $1 . \"\\n\";");
            processed = processed.replace(/console\.log\((.*)\)/g, "echo $1 . \"\\n\";");

            if (!processed.endsWith(";") && !processed.endsWith("{") && !processed.endsWith("}")) {
                processed += ";";
            }
            processed = processed.replace(/#/g, "//");
            convertedCode += processed + "\n";
        });
    }

    // --- TO SWIFT (Best Effort) ---
    else if (targetLang === 'swift') {
        convertedCode = "import Foundation\n\n";
        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Control Structures
            if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if $1 {")
                    .replace(/elif\s+(.*):/, "else if $1 {");
            } else if (processed.startsWith("else:")) {
                processed = "else {";
            } else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+(\w+)\s+in\s+range\((.*)\):/, "for $1 in 0..<$2 {");
            }

            // 2. Print
            processed = processed.replace(/console\.log\((.*)\)/g, "print($1)");

            // 3. Variables (var vs let is hard, defaulting to var)
            if (processed.match(/^[a-zA-Z_]\w*\s*=/)) {
                processed = "var " + processed;
            }

            processed = processed.replace(/#/g, "//");
            convertedCode += processed + "\n";
        });
    }

    // --- TO GO (Best Effort) ---
    else if (targetLang === 'go') {
        convertedCode = "package main\n\nimport \"fmt\"\n\nfunc main() {\n";
        const lines = code.split('\n');
        lines.forEach(line => {
            let processed = line.trim();
            if (!processed) return;

            // 1. Control Structures
            if (processed.startsWith("if ") || processed.startsWith("elif ")) {
                processed = processed.replace(/if\s+(.*):/, "if $1 {")
                    .replace(/elif\s+(.*):/, "else if $1 {");
            } else if (processed.startsWith("else:")) {
                processed = "else {";
            } else if (processed.startsWith("for ")) {
                processed = processed.replace(/for\s+(\w+)\s+in\s+range\((.*)\):/, "for $1 := 0; $1 < $2; $1++ {");
            }

            // 2. Print
            processed = processed.replace(/print\((.*)\)/g, "fmt.Println($1)");
            processed = processed.replace(/console\.log\((.*)\)/g, "fmt.Println($1)");

            // 3. Variables (Short declaration)
            if (processed.match(/^[a-zA-Z_]\w*\s*=/)) {
                processed = processed.replace(/=/, ":=");
            }

            processed = processed.replace(/#/g, "//");
            convertedCode += "    " + processed + "\n";
        });
        convertedCode += "}";
    }

    else {
        convertedCode += "// Automatic rule-based conversion for this specific pair is constrained.\n";
        convertedCode += "// We recommend reviewing the 'Recommended Tutorial' below to learn the syntax differences.\n\n";
        convertedCode += code;
    }

    return convertedCode;
}

module.exports = converterEngine;
