:: to download Procrun binaries and see documentation visit http://commons.apache.org/daemon/procrun.html

:: this file is used to Reinstall a service each time you run it,
:: if you need to uninstall comment out with "::" the install service line

::detect x86 or x64
echo off
IF PROCESSOR_ARCHITECTURE EQU "ia64" GOTO IS_ia64
IF PROCESSOR_ARCHITEW6432 EQU "ia64" GOTO IS_ia64
IF PROCESSOR_ARCHITECTURE EQU "amd64" GOTO IS_amd64
IF PROCESSOR_ARCHITEW6432 EQU "amd64" GOTO IS_amd64
IF DEFINED ProgramFiles(x86) GOTO IS_amd64
:IS_x86
set prunsrv=C:\commons-daemon-1.0.10-bin-windows\prunsrv.exe
GOTO IS_x64End
:IS_amd64
set prunsrv=C:\commons-daemon-1.0.10-bin-windows\amd64\prunsrv.exe
GOTO IS_x64End
:IS_ia64
set prunsrv=C:\commons-daemon-1.0.10-bin-windows\ia64\prunsrv.exe
::GOTO IS_x64End
:IS_x64End
echo on
::end detect x86 or x64

::stop service:
::net stop awschedule

::delete service:
%prunsrv% //DS//awschedule

::install service:
:: ++StartParams is the arguments. arguments are separated with "#"
::%prunsrv% //IS//awschedule --DisplayName="aw schedule" --Startup=auto --Install=%prunsrv% --StartMode=exe --StartImage="C:\\Program Files (x86)\\nodejs\\node.exe" ++StartParams=D:\visual-studio-projects\aw-meeting-schedule\app.js --StdOutput=D:\visual-studio-projects\aw-meeting-schedule\logs\std.out.log --StdError=D:\visual-studio-projects\aw-meeting-schedule\logs\std.err.log ++DependsOn=mongodb

::start service:
::net start awschedule