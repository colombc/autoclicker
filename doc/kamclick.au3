#include <GUIConstantsEx.au3>
#include <WindowsConstants.au3>
#include <GDIPlus.au3>
#include <WinAPI.au3>


$starter = IniRead("autoclick.ini", "cfg", "start", "{F1}")
$stop = IniRead("autoclick.ini", "cfg", "stop", "{F2}")
$setposs = IniRead("autoclick.ini", "cfg", "setPoss", "{F3}")
$escape = IniRead("autoclick.ini", "cfg", "esc", "{F10}")
HotKeySet( $starter, "start")
HotKeySet( $stop, "stop")
HotKeySet( $setposs, "setposs")
HotKeySet($escape, "esc")





$hGUI = GUICreate("KamClick V1.2",400, 400, @DesktopWidth / 2 - 160, @DesktopHeight / 2 - 45, -1, 0x00000018)


GUISetState(@SW_SHOW)

GUICtrlCreatePic("data.kam", 30, 250, 200, 100)
GUICtrlCreateLabel("esc to quit programme", 5, 0) ; next line
$running = GUICtrlCreateLabel("not running : F1 to start", 10, 30) ; next line
GUICtrlSetColor ( $running, 0xc81418)
GUICtrlCreateLabel("nb click", 150, 30) ; next line
$nbclick = GUICtrlCreateInput("0", 200, 30, 40, 20)  
GUICtrlCreateLabel("intervale between clicks", 10, 60) ; next line
GUICtrlCreateLabel("heure", 10, 90) ; next line
GUICtrlCreateLabel("min", 50, 90) ; next line
GUICtrlCreateLabel("sec", 90, 90) ; next line
GUICtrlCreateLabel("1/100 sec", 130, 90) ; next line
$heure = GuiCtrlCreateInput("0", 10, 110, 40, 20)
GuiCtrlCreateUpDown(-1)
$min = GuiCtrlCreateInput("0", 50, 110, 40, 20)
GuiCtrlCreateUpDown(-1)
$sec = GuiCtrlCreateInput("0", 90, 110, 40, 20)
GuiCtrlCreateUpDown(-1)
$centSec = GuiCtrlCreateInput("0", 130, 110, 40, 20)
GuiCtrlCreateUpDown(-1)
$random = GuiCtrlCreateCheckbox("random", 10, 170)
GUICtrlCreateLabel("range", 10, 200) ; next line
$rangeA = GuiCtrlCreateInput("0", 40, 200, 40, 20)
GUICtrlCreateLabel("to", 84, 200) ; next line
$rangeB = GuiCtrlCreateInput("0", 100, 200, 40, 20)
$rdmComboTime = GuiCtrlCreatecombo("in ms", 150, 200, 120, 100)
GUICtrlSetData($rdmComboTime, "in seconde|in minute", "in seconde")

GUICtrlCreateLabel("KamSoft© 2011 - Coded by Kam - V1.2", 210, 385) ; next line

; -----------------  groupe chose click ----------------
GuiCtrlCreateGroup("Mouse button", 270, 250, 100, 100)
$left = GuiCtrlCreateRadio("left", 290, 270)
GuiCtrlSetState($left, $GUI_CHECKED)
GuiCtrlCreateRadio("right", 290, 300)


; -----------------  groupe position mouse -------------------------
GuiCtrlCreateGroup("click position", 230, 50, 130, 130)
$positionCheck = GuiCtrlCreateCheckbox("click position", 240, 65)
$posX = GuiCtrlCreateInput("0", 240, 90, 40, 20)
GUICtrlCreateLabel("X position", 290, 90) ; next line
$posY = GuiCtrlCreateInput("0", 240, 120, 40, 20)
GUICtrlCreateLabel("Y position", 290, 120) ; next line
GUICtrlCreateLabel($setPoss&" to set position", 240, 150) ; next line

stop()

$start = false
$intervale = 0
While 1
	$dif = 0
	$begin = TimerInit()
	$intervale = 0
	if $start Then
		if GUICtrlRead($left) = $GUI_CHECKED then
			$typeClick = "left"
		else
			$typeClick = "right"
		endif
		
		if GUICtrlRead($random) = $GUI_CHECKED then
			if GUICtrlRead($rdmComboTime) = "in ms" then
				$intervale = Random(GUICtrlRead($rangeA), GUICtrlRead($rangeB), 1)
			elseif GUICtrlRead($rdmComboTime) = "in seconde" then
				$intervale = Random(GUICtrlRead($rangeA)*1000, GUICtrlRead($rangeB)*1000, 1)
			else
				$intervale = Random(GUICtrlRead($rangeA)*60000, GUICtrlRead($rangeB)*60000, 1)
			endif
		else
			$intervale = GUICtrlRead($heure)*3600000 + GUICtrlRead($min)*60000 + GUICtrlRead($sec)*1000 + GUICtrlRead($centSec)*10
		endif
		
		if GUICtrlRead($positionCheck) = $GUI_CHECKED  then
			MouseClick($typeClick,GUICtrlRead($posX), GUICtrlRead($posY) )
		else
			MouseClick($typeClick)
		endif
		$val = GUICtrlRead($nbclick)+1
		GUICtrlSetData($nbclick, $val)
	EndIf
	if GUIGetMsg() == $GUI_EVENT_CLOSE then
		Exit 0
	endif
	sleep(10)
	while $dif < $intervale and $start
		sleep(10)
		$dif = int (TimerDiff($begin))
		if GUIGetMsg() == $GUI_EVENT_CLOSE then
			Exit 0
		endif
		
	wend


wend



Func start()
	$start = true
	GUICtrlSetColor ( $running, 0x2bb627)
	GUICtrlSetData($running, "running : "&$stop&" to stop")
EndFunc
Func stop()
	$start = false
	GUICtrlSetColor ( $running, 0xc81418)
	GUICtrlSetData($running, "not running : "&$starter&" to start")
	GUICtrlSetData($nbclick, 0)
EndFunc
Func setposs()
	$pos = MouseGetPos()
	GUICtrlSetData($posY, $pos[1])
	GUICtrlSetData($posX, $pos[0])
EndFunc
Func esc()
	; Clean up resources
	exit 0
EndFunc
