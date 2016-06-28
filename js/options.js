function init(){
	$("#updateInterval").prop( "value", localStorage.getItem("updateInterval") );
	if(localStorage.getItem("notifyViews")!='-1'){
		$("#notifyViews").prop( "checked", true );
	}
	else{
		$("#notifyViews").prop( "checked", false );
	}
	if(localStorage.getItem("notifyComments")!='-1'){
		$("#notifyComments").prop( "checked", true );
	}
	else{
		$("#notifyComments").prop( "checked", false );
	}
	if(localStorage.getItem("newCommentsBlock")!='-1'){
		$("#newCommentsBlock").prop( "checked", true );
	}
	else{
		$("#newCommentsBlock").prop( "checked", false );
	}
	if(localStorage.getItem("trendGraphBlock")!='-1'){
		$("#trendGraphBlock").prop( "checked", true );
	}
	else{
		$("#trendGraphBlock").prop( "checked", false );
	}
	if(localStorage.getItem("youtube")!='-1'){
		$("#youtube").prop( "checked", true );
	}
	else{
		$("#youtube").prop( "checked", false );
	}
	if(localStorage.getItem("youku")!='-1'){
		$("#youku").prop( "checked", true );
	}
	else{
		$("#youku").prop( "checked", false );
	}
	if(localStorage.getItem("bilibili")!='-1'){
		$("#bilibili").prop( "checked", true );
	}
	else{
		$("#bilibili").prop( "checked", false );
	}
	if(localStorage.getItem("acfun")!='-1'){
		$("#acfun").prop( "checked", true );
	}
	else{
		$("#acfun").prop( "checked", false );
	}
	$("#updateInterval").change(function(){
		localStorage.setItem('updateInterval',this.value);
		chrome.runtime.sendMessage({job: "updateInterval"}, function(response) {
			if(response.done==true){
				$("#display").html($("#display").html()+"<br /> updated!");
			}
		});
	});
	$("#notifyViews").change(function(){
		if(this.checked){
			localStorage.setItem('notifyViews','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('notifyViews','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
	
	$("#newCommentsBlock").change(function(){
		if(this.checked){
			localStorage.setItem('newCommentsBlock','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('newCommentsBlock','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
	$("#trendGraphBlock").change(function(){
		if(this.checked){
			localStorage.setItem('trendGraphBlock','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('trendGraphBlock','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});

	
	$("#notifyComments").change(function(){
		if(this.checked){
			localStorage.setItem('notifyComments','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('notifyComments','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
	
	$("#youtube").change(function(){
		if(this.checked){
			localStorage.setItem('youtube','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('youtube','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
	$("#youku").change(function(){
		if(this.checked){
			localStorage.setItem('youku','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('youku','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
	$("#bilibili").change(function(){
		if(this.checked){
			localStorage.setItem('bilibili','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('bilibili','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
	$("#acfun").change(function(){
		if(this.checked){
			localStorage.setItem('acfun','1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
		else{
			localStorage.setItem('acfun','-1');
			$("#display").html($("#display").html()+"<br /> updated!");
		}
	});
}


document.addEventListener('DOMContentLoaded', function(){
	init();
});