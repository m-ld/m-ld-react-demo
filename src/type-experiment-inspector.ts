import * as ts from "typescript";

/**
 * True if this is visible outside this file, false otherwise
 * From:
 * https://github.com/microsoft/TypeScript-wiki/blob/main/Using-the-Compiler-API.md
 */
function isNodeExported(declaration: ts.Declaration): boolean {
  return (
    (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Export) !== 0
  );
}

function extractExportedTypeSignatures(filename: string): string[] {
  const program: ts.Program = ts.createProgram([filename], {
    emitDeclarationOnly: true,
  });
  const sourceFile: ts.SourceFile | undefined = program.getSourceFile(filename);
  const typeChecker: ts.TypeChecker = program.getTypeChecker();

  if (!sourceFile) {
    throw new Error(`'${filename}' not found`);
  }

  // Get the declaration node you're looking for by it's type name.
  // This condition can be adjusted to your needs
  const statements = sourceFile.statements
    .filter(ts.isTypeAliasDeclaration)
    .filter((s) => isNodeExported(s));

  //   if (!statement) {
  //     throw new Error(`Type: '${aliasName}' not found in file: '${filename}'`);
  //   }
  return statements.map((statement) => {
    const type: ts.Type = typeChecker.getTypeAtLocation(statement);
    const fields: string[] = [];
    // Iterate over the `ts.Symbol`s representing Property Nodes of `ts.Type`
    for (const prop of type.getProperties()) {
      const name: string = prop.getName();
      const propType: ts.Type = typeChecker.getTypeOfSymbolAtLocation(
        prop,
        statement
      );
      const propTypeName: string = typeChecker.typeToString(propType);
      fields.push(`${name}: ${propTypeName};`);
    }
    return `type ${statement.name.text} = {\n  ${fields.join("\n  ")}\n}`;
  });
}

const typeSignatures = extractExportedTypeSignatures(
  "./src/type-experiments.ts"
);

console.log(typeSignatures.join("\n\n"));
