app.doScript(function(){
var fontObj=app.activeWindow.activePage.textFrames.add();
//　ダイアログ作成
var objDlg = new Window("dialog", "テキストの組み方向を選択", [0,0,250,280]);
var objStText01 = objDlg.add("statictext", [20,20,250,40], "テキストの組み方向を選んでください。");
var radioBtn01= objDlg.add("radiobutton", [40, 80, 140, 190], "タテ組み");
var radioBtn02= objDlg.add("radiobutton", [130, 80, 240, 190], "ヨコ組み");
objDlg.add("button", [60, 140, 200, 200], "配置を開始", {name:"ok"});
objDlg.add("button", [80, 220, 180, 260], "キャンセル", {name:"cancel"});
radioBtn01.value = true;
objDlg.center();
var rtType = objDlg.show();
if (rtType==1){
    var orientation = radioBtn01.value;
    if(orientation === true){
        orientation = 1986359924; }else{
            var orientation = 1752134266;
        }
}else if (rtType==2){
    fontObj.remove(); 
    exit();
}
fontObj.parentStory.storyPreferences.storyOrientation = orientation;
if (fontObj===undefined || fontObj.constructor.name !== "TextFrame") {
	alert("「配置開始ページの基準となるテキストフレーム」が選択されていません。\n\n配置を開始するページにテキストフレームを作成し、選択した状態でスクリプトを実行してください。");
    fontObj.remove();
   exit();
}
var activePageNum = fontObj.parentPage.name,
	orientation = fontObj.parentStory.storyPreferences.storyOrientation,
	leading = fontObj.parentStory.leading,
	fontFamily = fontObj.parentStory.appliedFont.fontFamily,
	fontStyle = fontObj.parentStory.appliedFont.fontStyleName,
	fontSize = fontObj.parentStory.pointSize;
var fontSizeMM = Number(fontSize) * 0.25;
if(leading == 1635019116){
	var leadingMM = fontSizeMM * 1.75;     
    var leadingTEXT = "自動";
    }
	else{
		var leadingMM = Number(leading) * 0.25; 
                var leadingTEXT = leading;
	}
var txtFile = File.openDialog ("CLIP STUDIO PAINTから書き出されたテキストファイルを選択してください","*.txt");
if (!txtFile){ fontObj.remove();  exit();}
var dataArray = new Array();
if(txtFile != "" && txtFile != null){
     txtFile.open("r")
    var txtStr=txtFile.read();
        var txtData = new Array();
        if (txtStr=== ""){alert("空のテキストファイルが読み込まれました。処理を中断します。"); fontObj.remove(); exit();}
        var bubbles = txtStr.split("\n\n\n");
		var strings = bubbles[0].split("\n");
		var startPageNum = strings[0].replace("<<", "");
         var result = startPageNum.indexOf( "Page>>", 0);
         if (result === -1){alert("ページ数表記が見つかりません。処理を中断します。\n\n対象のファイルが、クリスタから書き出された形式のものか確認してください。"); fontObj.remove(); exit();}
		startPageNum = startPageNum.replace("Page>>", "");
		startPageNum = startPageNum.split(",");
		var startPageNum = startPageNum[0];
        for (var i = 0; i < bubbles.length;i++) {	
			var strings = bubbles[i].split("\n");
			if (strings[0] != "" && strings[0] != null){
			var pageNum = strings[0].replace("<<", "");
			pageNum = pageNum.replace("Page>>", "");
			pageNum = pageNum.split(","); 
			pageNum = pageNum[0] - startPageNum;
					if(pageNum>=0){
						var pageNum　= Number(pageNum) + Number(activePageNum) -1;                        
                        var docPages = app. activeDocument.pages.length;
                        if (pageNum>=docPages) {alert("ドキュメントの総ページ数を超えたため、読み込みを中断します。\n\n読み込み開始ページと、読み込むファイルの内容が合っているか確認してください。");
                            exit();
                            }
						app.activeWindow.activePage = app.activeDocument.pages.item(pageNum);
						var curPage = app.activeDocument.pages.item(pageNum);
						var boundsL = curPage.bounds[1],
							boundsR = curPage.bounds[3];
						var dir = curPage.side;
						var pageBubbles = bubbles[i].substr(bubbles[i].indexOf('\n') + 1);
						pageBubbles = pageBubbles.split("\n\n");
						var x = 0, y=0;	var maxLineNum = 0;	var maxArr = [];
							for (var k = 0; k < pageBubbles.length;k++) {								
								var myTextframe = app.activeWindow.activePage.textFrames.add();
								myTextframe.properties = fontObj.properties;
								myTextframe.parentStory.storyPreferences.properties = fontObj.parentStory.storyPreferences.properties;
								myTextframe.contentType = ContentType.textType;
								myTextframe.contents = pageBubbles[k];							
								//各フキダシの最大行数と、行あたりの最大文字数を取得
								var lines = pageBubbles[k].split("\n");
								var lineNum = lines.length;
								if(k>0){//配置の重複防止
								var preLines = pageBubbles[k-1].split("\n");
								var preLineNum = preLines.length;
								if(preLineNum>maxLineNum) {	
									maxLineNum = preLineNum;}	
								}	
								//フキダシ各行のうち、最大の文字数を記録
								var max = 5;
									for(var m = 0; m < lines.length; m++){
										if(lines[m].length>max) max = lines[m].length+1;
										maxArr.push(max);
									}						
								//縦組みのとき
								if(orientation == 1986359924){
								var sizeY = fontSizeMM*(max) + 2,
									sizeX = leadingMM*lineNum;	
								myTextframe.visibleBounds = ["0mm","0mm", sizeY + "mm", sizeX +"mm"];
								var border = sizeX+x;
								if(dir == PageSideOptions.RIGHT_HAND) border = border * 2;
								if(border>=boundsR && border>=sizeX){							
									var max = 5;
									for(var p = 0; p < maxArr.length-1; p++){
										if(maxArr[p]>max){max = maxArr[p];}
									}
									maxArr.splice(0,maxArr.length-1);
									var maxLineSize = fontSizeMM*(max);
									x = 0, y = y+maxLineSize; 
								}
								myTextframe.move([x+boundsL,y]);	
								x = x + sizeX;
								}else{
								var sizeY = leadingMM*(lineNum+1) ,
									sizeX = fontSizeMM*max + 2,
									maxLineSize = leadingMM*(maxLineNum+1);	
								myTextframe.visibleBounds = ["0mm","0mm", sizeY + "mm", sizeX +"mm"];
								var border = sizeX+x;
								if(dir == PageSideOptions.RIGHT_HAND) border = border * 2;
								if(border>=boundsR && border>=sizeX){
									x = 0, y = y+maxLineSize; 
									var maxLineNum = 0;
																	}
								myTextframe.move([x+boundsL,y]);	
								x = x + sizeX;
								}
							}
					}
				}
        }
fontObj.remove(); 
alert("配置が完了しました。"); 
	}
},ScriptLanguage.JAVASCRIPT,[],UndoModes.FAST_ENTIRE_SCRIPT);
