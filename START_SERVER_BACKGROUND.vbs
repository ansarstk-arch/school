Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
BackendDir = ScriptDir & "\backend"

' Change to backend directory and run server
WshShell.CurrentDirectory = BackendDir
WshShell.Run "node server.js", 0, False

' Wait a bit for server to start
WScript.Sleep 5000

' Show notification
WshShell.Popup "School Management Server Started!" & vbCrLf & vbCrLf & "This PC: http://localhost:3000" & vbCrLf & "Phones: http://192.168.43.215:3000", 8, "School System Ready", 64
