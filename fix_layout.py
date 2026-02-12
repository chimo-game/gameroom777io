import glob, re

for fpath in sorted(glob.glob("pages/*.html")):
    if fpath == "pages/account-activated.html":
        continue
    
    with open(fpath, "r") as f:
        content = f.read()
    
    # Step 1: Restore ALL align-items: flex-start -> center
    # (The bad sed changed every center to flex-start)
    content = content.replace("align-items: flex-start;", "align-items: center;")
    
    # Step 2: Fix the ones that genuinely need flex-start
    # .li items (icon + text, icon at top)
    content = content.replace(
        ".li {\n      display: flex;\n      gap: 10px;\n      align-items: center;",
        ".li {\n      display: flex;\n      gap: 10px;\n      align-items: flex-start;"
    )
    # .field items (label + input stacked)
    content = content.replace(
        ".field {\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      gap: 8px;\n    }",
        ".field {\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      gap: 8px;\n    }"
    )
    # .header (items at top)
    content = content.replace(
        ".header {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;",
        ".header {\n      display: flex;\n      align-items: flex-start;\n      justify-content: space-between;"
    )
    # .wrap align-items should be start (not center)
    content = content.replace(
        "align-items: start;",
        "align-items: start;"
    )
    
    # Step 3: Fix body block — add flex-direction: column and keep align-items: center
    # Replace body block pattern
    content = re.sub(
        r"(body\s*\{[^}]*?)display:\s*flex;",
        r"\1display: flex;\n      flex-direction: column;",
        content,
        count=1
    )
    content = re.sub(
        r"(body\s*\{[^}]*?)justify-content:\s*center;",
        r"\1justify-content: flex-start;",
        content,
        count=1
    )
    
    with open(fpath, "w") as f:
        f.write(content)
    print(f"  OK: {fpath}")

print("Done!")
