// 723ClipStudioTextImporter
// クリスタから書き出されたテキストを、InDesignドキュメントの各ページに自動配置するスクリプトです。
// 作成者：ナカシマ723

// 定数の定義
const VERTICAL_ORIENTATION = 1986359924;
const HORIZONTAL_ORIENTATION = 1752134266;

// UIの設定関数
function setupDialog(activePageNum) {
	var dialog = new Window("dialog", "クリスタから書き出されたテキストを自動配置", [0, 0, 300, 400]);
	dialog.add("statictext", [30, 20, 280, 40], "選択中の段落スタイルで配置を開始します。");
	dialog.add("statictext", [80, 65, 280, 95], "開始位置：" + activePageNum + "ページ目");
	dialog.add("statictext", [45, 120, 280, 140], "テキストの組み方向を選んでください。");
	var radioBtn01 = dialog.add("radiobutton", [65, 170, 150, 280], "タテ組み");
	var radioBtn02 = dialog.add("radiobutton", [160, 170, 250, 280], "ヨコ組み");
	dialog.add("button", [40, 230, 265, 290], "ファイルを選択し、配置を開始", { name: "ok" });
	dialog.add("button", [100, 310, 200, 350], "キャンセル", { name: "cancel" });
	radioBtn01.value = true;
	return dialog;
}

// エラーメッセージの表示関数
function showError(message) {
	alert(message);
	exit();
}

// テキストプロパティの取得関数
function getTextProperties(textFrame) {
	var properties = {};
	properties.pointSize = textFrame.parentStory.pointSize;
	properties.leading = textFrame.parentStory.leading;
	properties.appliedFont = textFrame.parentStory.appliedFont;
	properties.storyOrientation = textFrame.parentStory.storyPreferences.storyOrientation;
	return properties;
}

// テキストファイルの読み込み関数
function loadTextFile() {
	var txtFile = File.openDialog("CLIP STUDIO PAINTから書き出されたテキストファイルを選択してください", "*.txt");
	if (!txtFile) return null;

	txtFile.open("r");
	var txtContent = txtFile.read();
	txtFile.close();
	if (txtContent === "") return null;

	return txtContent;
}

// バブルをページに配置する関数
function placeBubblesOnPage(page, bubbles, textFrameProperties, orientation) {
	var boundsL = page.bounds[1], boundsR = page.bounds[3];
	var x = 0, y = 0, maxLineNum = 0, maxArr = [];

	for (var k = 0; k < bubbles.length; k++) {
		var bubbleTextFrame = app.activeWindow.activePage.textFrames.add();
		bubbleTextFrame.properties = textFrameProperties;
		bubbleTextFrame.parentStory.storyPreferences.storyOrientation = orientation;
		bubbleTextFrame.contents = bubbles[k];

		var lines = bubbles[k].split("\n");
		var lineNum = lines.length;

		if (k > 0) {
			var preLines = bubbles[k - 1].split("\n");
			var preLineNum = preLines.length;
			if (preLineNum > maxLineNum) {
				maxLineNum = preLineNum;
			}
		}

		var max = 5;
		for (var m = 0; m < lines.length; m++) {
			if (lines[m].length > max) max = lines[m].length + 1;
			maxArr.push(max);
		}

		var sizeY, sizeX, maxLineSize;
		if (orientation == VERTICAL_ORIENTATION) {
			sizeY = textFrameProperties.pointSize * max * 0.25 + 2;
			sizeX = textFrameProperties.leading * lineNum * 0.25;
			bubbleTextFrame.visibleBounds = ["0mm", "0mm", sizeY + "mm", sizeX + "mm"];
			if (boundsL + x + sizeX >= boundsR) {
				x = 0;
				y += textFrameProperties.pointSize * Math.max(...maxArr) * 0.25;
				maxArr = [];
			}
			bubbleTextFrame.move([x + boundsL, y]);
			x += sizeX;
		} else {
			sizeY = textFrameProperties.leading * (lineNum + 1) * 0.25;
			sizeX = textFrameProperties.pointSize * max * 0.25 + 2;
			maxLineSize = textFrameProperties.leading * (maxLineNum + 1) * 0.25;
			bubbleTextFrame.visibleBounds = ["0mm", "0mm", sizeY + "mm", sizeX + "mm"];
			if (boundsL + x + sizeX >= boundsR) {
				x = 0;
				y += maxLineSize;
				maxLineNum = 0;
			}
			bubbleTextFrame.move([x + boundsL, y]);
			x += sizeX;
		}
	}
}

// スクリプトのエントリーポイント
app.doScript(function () {
	var textFrame = app.activeWindow.activePage.textFrames.add();
	var activePageNum = textFrame.parentPage.name;
	var dialog = setupDialog(activePageNum);
	dialog.center();
	var resultType = dialog.show();

	if (resultType == 1) {
		var orientation = dialog.children[3].value ? VERTICAL_ORIENTATION : HORIZONTAL_ORIENTATION;
	} else {
		textFrame.remove();
		exit();
	}

	textFrame.parentStory.storyPreferences.storyOrientation = orientation;

	if (!textFrame || textFrame.constructor.name !== "TextFrame") {
		showError("「配置開始ページの基準となるテキストフレーム」が選択されていません。\n\n配置を開始するページにテキストフレームを作成し、選択した状態でスクリプトを実行してください。");
		textFrame.remove();
	}

	var txtContent = loadTextFile();
	if (!txtContent) {
		showError("空のテキストファイルが読み込まれました。処理を中断します。");
		textFrame.remove();
	}

	var bubbles = txtContent.split("\n\n\n");
	var firstPageLine = bubbles[0].split("\n")[0];
	var startPageNum = parseInt(firstPageLine.replace("<<", "").replace("Page>>", "").split(",")[0]);
	if (isNaN(startPageNum)) {
		showError("ページ数表記が見つかりません。処理を中断します。\n\n対象のファイルが、クリスタから書き出された形式のものか確認してください。");
		textFrame.remove();
	}

	for (var i = 0; i < bubbles.length; i++) {
		var bubbleLines = bubbles[i].split("\n");
		var pageNum = parseInt(bubbleLines[0].replace("<<", "").replace("Page>>", "").split(",")[0]) - startPageNum + parseInt(activePageNum) - 1;
		if (pageNum >= app.activeDocument.pages.length) {
			showError("ドキュメントの総ページ数を超えたため、読み込みを中断します。\n\n読み込み開始ページと、読み込むファイルの内容が合っているか確認してください。");
		}
		app.activeWindow.activePage = app.activeDocument.pages.item(pageNum);
		var curPage = app.activeDocument.pages.item(pageNum);
		placeBubblesOnPage(curPage, bubbleLines.slice(1), getTextProperties(textFrame), orientation);
	}

	textFrame.remove();
	alert("配置が完了しました。");
}, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT);
