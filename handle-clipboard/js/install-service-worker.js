if ('serviceWorker' in navigator) {
	// service-worker.js は 操作対象より上位のディレクトリに配置しないとならない
	// 相対 path の base はこの js ファイルの path ではなく、呼び出し元 html の path
	navigator.serviceWorker.register('./service-worker.js').then(registration => {
		console.log('navigator.serviceWorker.register 成功', registration);
	}).catch(err => {
		console.log('navigator.serviceWorker.register 失敗', err);
	});
}
