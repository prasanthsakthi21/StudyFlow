
function debugCode(code) {
    let fixedCode = code;
    let errorType = null;
    let errorDescription = "No obvious errors found.";
    let explanation = "The code appears to be syntactically correct based on our checks.";
    let bestPractice = "Ensure your code is properly indented and commented.";
    let isError = false;

    const lines = code.split('\n');

    // --- LANGUAGE DETECTION ---
    let language = "unknown";
    if (code.includes("def ") || code.includes("print(")) language = "python";
    else if (code.includes("function") || code.includes("console.log") || code.includes("const ")) language = "javascript";
    else if (code.includes("public class") || code.includes("System.out")) language = "java";
    else if (code.includes("#include")) language = "c_cpp";

    // --- HEURISTIC CHECKS ---

    // 1. Parentheses/Bracket Balance (Universal)
    const openParen = (code.match(/\(/g) || []).length;
    const closeParen = (code.match(/\)/g) || []).length;
    const openBrace = (code.match(/\{/g) || []).length;
    const closeBrace = (code.match(/\}/g) || []).length;

    if (openParen !== closeParen) {
        isError = true;
        errorType = "Syntax Error";
        errorDescription = `Unbalanced Parentheses: Found ${openParen} '(' and ${closeParen} ')'.`;
        explanation = "Check your function calls and loop conditions. You are likely missing a closing ')' or have an extra '('.";
        // Attempt a naive fix: append ')' if open > close?? Too risky to auto-fix robustly without parsing.
    } else if (openBrace !== closeBrace && language !== 'python') {
        isError = true;
        errorType = "Syntax Error";
        errorDescription = `Unbalanced Braces: Found ${openBrace} '{' and ${closeBrace} '}'.`;
        explanation = "You are likely missing a closing '}' for a function or class definition.";
        if (openBrace > closeBrace) {
            fixedCode += "\n}"; // Naive fix
            explanation += " Added a closing brace at the end.";
        }
    }

    // 2. JavaScript / Common Typos
    if (language === 'javascript' || language === 'unknown') {
        // console.log typos
        if (code.match(/consol\.log|console\.lg|print\(/)) {
            isError = true;
            errorType = "Typo";
            errorDescription = "Incorrect print statement or logging function.";
            explanation = "In JavaScript, use 'console.log()' to print to the console.";
            fixedCode = fixedCode.replace(/consol\.log/g, "console.log")
                .replace(/console\.lg/g, "console.log")
                .replace(/print\(/g, "console.log(");
        }

        // Equality
        if (code.match(/if\s*\([^=]*=[^=]*\)/)) {
            // e.g. if (x = 5) - technically valid but usually a bug
            isError = true;
            errorType = "Logic Error";
            errorDescription = "Assignment used in conditional statement.";
            explanation = "You used '=' (assignment) instead of '==' or '===' (comparison) inside an 'if' statement.";
            fixedCode = fixedCode.replace(/(if\s*\([^=]*)=([^=]*\))/g, "$1===$2");
            bestPractice = "Always use '===' for strict equality comparisons to avoid type coercion issues.";
        }
    }

    // 3. Python Specifics
    if (language === 'python') {
        // Missing colon
        const missingColonRegex = /^(def|if|for|while|class)[^:]*$/gm;
        if (code.match(missingColonRegex)) {
            isError = true;
            errorType = "Syntax Error";
            errorDescription = "Missing colon ':'";
            explanation = "Python requires a colon ':' at the end of function definitions, loops, and conditionals.";
            fixedCode = fixedCode.replace(/^((def|if|for|while|class).*[^:])$/gm, "$1:");
        }

        // Indentation (Simple check: block start without indent next line)
        // Hard to regex fix reliably, but can warn.
    }

    // 4. Java/C++ Semicolons
    if (language === 'java' || language === 'c_cpp') {
        // Look for lines ending with ) or identifier that aren't blocks
        // This is a rough heuristic
        const lines = fixedCode.split('\n');
        const scFixedLines = lines.map(line => {
            const t = line.trim();
            if (t.length > 2 && !t.endsWith(';') && !t.endsWith('{') && !t.endsWith('}') && !t.startsWith('//') && !t.startsWith('#')) {
                if (t.match(/\)|=|\w+/)) { // basic check
                    // Should probably return true here?
                    // Let's just flag it if we find widespread misuse
                }
            }
            return line;
        });

        if (code.includes("System.out.print") && !code.includes(";")) {
            isError = true;
            errorType = "Syntax Error";
            errorDescription = "Missing Semicolon";
            explanation = "Statements in Java/C++ must end with a semicolon ';'.";
            fixedCode = fixedCode.replace(/(System\.out\.print.*)\)/g, "$1);");
        }
    }

    // Default if no error found but the user asked for debug?
    // We will just return "Clean" state.

    return {
        isError,
        errorType,
        error: errorDescription,
        explanation,
        fixedCode,
        bestPractice,
        improvedCode: fixedCode // For now, improved is the same as fixed
    };
}

module.exports = debugCode;
