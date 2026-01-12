# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:react-babel] /app/App.tsx: 'return' outside of function. (1110:2) 1113 | <Sidebar"
  - generic [ref=e5]: /app/App.tsx:1110:2
  - generic [ref=e6]: "1108| const showSidebar = currentPage !== 'landing' && currentPage !== 'auth'; 1109| 1110| return ( | ^ 1111| <div className=\"flex h-screen w-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 font-sans\"> 1112| {showSidebar && ("
  - generic [ref=e7]: at constructor (/app/node_modules/@babel/parser/lib/index.js:367:19) at TypeScriptParserMixin.raise (/app/node_modules/@babel/parser/lib/index.js:6624:19) at TypeScriptParserMixin.parseReturnStatement (/app/node_modules/@babel/parser/lib/index.js:13212:12) at TypeScriptParserMixin.parseStatementContent (/app/node_modules/@babel/parser/lib/index.js:12874:21) at TypeScriptParserMixin.parseStatementContent (/app/node_modules/@babel/parser/lib/index.js:9569:18) at TypeScriptParserMixin.parseStatementLike (/app/node_modules/@babel/parser/lib/index.js:12843:17) at TypeScriptParserMixin.parseModuleItem (/app/node_modules/@babel/parser/lib/index.js:12820:17) at TypeScriptParserMixin.parseBlockOrModuleBlockBody (/app/node_modules/@babel/parser/lib/index.js:13392:36) at TypeScriptParserMixin.parseBlockBody (/app/node_modules/@babel/parser/lib/index.js:13385:10) at TypeScriptParserMixin.parseProgram (/app/node_modules/@babel/parser/lib/index.js:12698:10) at TypeScriptParserMixin.parseTopLevel (/app/node_modules/@babel/parser/lib/index.js:12688:25) at TypeScriptParserMixin.parse (/app/node_modules/@babel/parser/lib/index.js:14568:25) at TypeScriptParserMixin.parse (/app/node_modules/@babel/parser/lib/index.js:10183:18) at parse (/app/node_modules/@babel/parser/lib/index.js:14602:38) at parser (/app/node_modules/@babel/core/lib/parser/index.js:41:34) at parser.next (<anonymous>) at normalizeFile (/app/node_modules/@babel/core/lib/transformation/normalize-file.js:64:37) at normalizeFile.next (<anonymous>) at run (/app/node_modules/@babel/core/lib/transformation/index.js:22:50) at run.next (<anonymous>) at transform (/app/node_modules/@babel/core/lib/transform.js:22:33) at transform.next (<anonymous>) at step (/app/node_modules/gensync/index.js:261:32) at /app/node_modules/gensync/index.js:273:13 at async.call.result.err.err (/app/node_modules/gensync/index.js:223:11) at /app/node_modules/gensync/index.js:189:28 at /app/node_modules/@babel/core/lib/gensync-utils/async.js:67:7 at /app/node_modules/gensync/index.js:113:33 at step (/app/node_modules/gensync/index.js:287:14) at /app/node_modules/gensync/index.js:273:13 at async.call.result.err.err (/app/node_modules/gensync/index.js:223:11
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```