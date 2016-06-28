var websiteList=['youtube','youku','bilibili','acfun'];
var linkLists={
	'youtube'	:	'https://www.youtube.com/dashboard?o=U',
	'youku'		:	'http://i.youku.com/u/videos',
	'bilibili'	:	'http://member.bilibili.com/#video_manage',
	'acfun'		:	'http://www.acfun.tv/member/#area=post-history'
}

var lists=[];
var listsRead=[];
var readTime=[0,0,0,0];

function init(){
	initEvents();
	initDisplay();
	update();
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


function min(a,b){
	return a<b?a:b;
}

function isOn(s){
	return localStorage.getItem(s)!='-1';
}

function initDisplay(){
	for(var i=0;i<websiteList.length;i++){
		var website=websiteList[i];
		if(isOn(website)){
			$("#"+website+"_block").css("display","");
		}
	}
	$(".loader").hide();
}

function initLoader(){
	var temp=($('#main_block').height()-40)/2;
	for(var i=0;i<websiteList.length;i++){
		$(".loading"+(i+1)).css('margin-top',temp-i*25+"px");
	}
}

function initEvents(){
	$("#update").click(function(){
		chrome.runtime.sendMessage({job: "update"}, function(response) {
			if(response.updating==true){
				displayLoader();
				console.log("updating");
			}
			else{
				displayLoader(response.remainUpdates);
			}
		});
	});
	$("#reset").click(function(){
		for(var i=0;i<websiteList.length;i++){
			var website=websiteList[i];
			localStorage.setItem(website+'List','[]');
			localStorage.setItem(website+'ListRead','[]');
			chrome.browserAction.setBadgeText({text: ""});
			update();
		}
	});
	$("#readAll").click(function(){
		chrome.browserAction.setBadgeText({text: ""});
		for(var i=0;i<websiteList.length;i++){
			var website=websiteList[i];
			if(isOn(website)){
				setItem(website+'ReadTime',readTime[i]);
			}
		}
		localStorage.removeItem('newCommentList');
		update();
	});
	$('#graphType').change(displayTrendGraph);
}

function update(){
	displayMain();
	if(isOn('newCommentsBlock'))
		displayCommentDiv();
	if(isOn('displayTrendGraph'))
		displayTrendGraph();
	updateLayout();
	initLoader();
}



document.addEventListener('DOMContentLoaded', function(){
	chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.job.indexOf("remainUpdates")!=-1){
			update();
			displayLoader(parseInt(request.job[13]));
		}
	});
	init();
});


function displayLoader(i){
	if(i==null){
		i=-1;
	}
	var m=0;
	if(i==-1){
		i=0;
		for(var k=0;k<websiteList.length;k++){
			var website=websiteList[k]
			if(isOn(website)){
				i++;
			}
		}
	}
	for(var k=0;k<websiteList.length;k++){
		var website=websiteList[k]
		if(!isOn(website)){
			m++;
		}
	}
	for(var j=1;j<=m;j++){
		$(".loading"+j).hide();
	}
	for(var j=m+1;j<=i+m;j++){
		$(".loading"+j).show();
	}
	for(var j=i+m+1;j<=websiteList.length;j++){
		$(".loading"+j).hide();
	}
}

function updateLayout(){
	var bodyWidth=$('#mainBlock').width();
	if(isOn('newCommentsBlock')&&$('#newCommentsBlock').html().length>2){
		$('#newCommentsBlock').height($('#mainBlock').height());
		$('#newCommentsBlock').show();
		bodyWidth+=$('#newCommentsBlock').width();
	}
	else{
		$('#newCommentsBlock').hide();
		$('body').width($('#mainBlock').width());
	}
	$('#trendGraphBlock').height($('#mainBlock').height());
	if(onNum()==1){
		$('.trendGraph').height($('#mainBlock').height()-20);
		$('#totalTrendGraph').hide();
	}
	else{
		$('.trendGraph').height($('#mainBlock').height()/2-20);
	}
	if(!isOn('trendGraphBlock')){
		$('#trendGraphBlock').hide();
	}
	else{
		$('#trendGraphBlock').show();
		bodyWidth+=$('#trendGraphBlock').width();
	}
	$('body').width(bodyWidth);
}

function displayCommentDiv(){
	var commentBlock=$('#newCommentsBlock')[0];
	var newCommentList=getItem('newCommentList');
	if(newCommentList==null||newCommentList.length<5){
		commentBlock.innerHTML="";
		return;
	}
	commentBlock.innerHTML="<h3>New Comments</h3>";
	newCommentList=JSON.parse(newCommentList);
	var newComment="";
	for(var i=0;i<newCommentList.length;i++){
		var video=newCommentList[i];
		var title=video['title'];
		var url=video['url'];
		var imageUrl=video['imageUrl'];
		var newComments=video['newComments'];
		var website=video['website'];
		newComment+="<div>";
		newComment+="<a href="+url+' target="_blank"'+">"+'<img class="commentImage" src="'+imageUrl+'" title="'+title+'"><br />'+title+"</a><br />";
		newComment+='<img class="commentIcon" src="thirdParty/'+website+'_icon.png" title="'+website+'">';
		newComment+=" new comments: "+newComments;
		newComment+="</div>";
	}
	commentBlock.innerHTML+=newComment;
}

function displayTrendGraph(){
	var type=$('#graphType')[0].value;
	var totalData=[];
	var subData=[];
	var totalDataRaw=[];
	var cursorList=[];
	var cursorTime=9007199254740991;
	var labels=['Date'];
	for(var i=0;i<websiteList.length;i++){
		var website=websiteList[i];
		if(isOn(website)){
			totalDataRaw.push(JSON.parse(localStorage.getItem(website+'_updateChanges')));
			cursorList.push(0);
			labels.push(website);
		}
	}
	var done=false;
	while(!done){
		cursorTime=9007199254740991
		for(var i=0;i<cursorList.length;i++){
			if(totalDataRaw[i]==null){
				return;
			}
			if(totalDataRaw[i][cursorList[i]]!=null){
				cursorTime=Math.min(totalDataRaw[i][cursorList[i]].updateTime,cursorTime);
			}
		}
		var tempSub=[];
		var tempTotal=[];
		tempSub.push(new Date(cursorTime));
		tempTotal.push(new Date(cursorTime));
		var totalTemp=0;
		for(var i=0;i<cursorList.length;i++){
			if(cursorList[i]>=totalDataRaw[i].length||totalDataRaw[i][cursorList[i]].updateTime!=cursorTime){
				tempSub.push(null);
				if(totalDataRaw[i].length==0){
					return;
				}
				if(cursorList[i]>=totalDataRaw[i].length){
					totalTemp+=totalDataRaw[i][totalDataRaw[i].length-1][type];
				}
				else{
					totalTemp+=totalDataRaw[i][cursorList[i]-1][type];
				}
			}
			else{
				tempSub.push(totalDataRaw[i][cursorList[i]][type]);
				totalTemp+=totalDataRaw[i][cursorList[i]][type];
				cursorList[i]+=1;
			}
		}
		tempTotal.push(totalTemp);
		totalData.push(tempTotal);
		subData.push(tempSub);
		done=true;
		for(var i=0;i<cursorList.length;i++){
			if(cursorList[i]<totalDataRaw[i].length){
				done=false;
			}
		}
	}
	g=new Dygraph($('#totalTrendGraph')[0],totalData,{title:'Total '+type.capitalizeFirstLetter()+' Trend',labels:['Date','Total_'+type]});
	g=new Dygraph($('#subTrendGraph')[0],subData,{title:type.capitalizeFirstLetter()+' Trend',labels:labels});
}




function displayMain(){
	var allViewsNew=0,allViewsGone=0,
		allCommentsNew=0,allCommentsGone=0,
		allViewsPrev=0,allViews=0,
		allCommentsPrev=0,allComments=0;
	for(var i=0;i<websiteList.length;i++){
		var website=websiteList[i];
		if(isOn(website)){
			var viewsPrev=0,viewsNew=0,viewsGone=0,views=0,
			commentsPrev=0,commentsNew=0,commentsGone=0,comments=0;
			var lastReadTime=getItem(website+'ReadTime');
			var updateChanges=JSON.parse(getItem(website+'_updateChanges'));
			if(updateChanges!=null){
				for(var j=0;j<updateChanges.length;j++){
					var change=updateChanges[j];
					if(change.updateTime>readTime[i]){
						readTime[i]=change.updateTime;
					}
					if(change.updateTime>lastReadTime){
						viewsNew+=change.viewsNew;
						viewsGone+=change.viewsGone;
						commentsNew+=change.commentsNew;
						commentsGone+=change.commentsGone;
					}
					else if(change.updateTime==lastReadTime){
						viewsPrev=change.views;
						commentsPrev=change.comments;
						allViewsPrev+=viewsPrev;
						allCommentsPrev+=commentsPrev;
					}
				}
				views=updateChanges[updateChanges.length-1].views;
				comments=updateChanges[updateChanges.length-1].comments;
			}
			allViews+=views;
			allComments+=comments;
			allViewsNew+=viewsNew;
			allViewsGone+=viewsGone;
			allCommentsNew+=commentsNew;
			allCommentsGone+=commentsGone;
			$("#"+website+"Views").html(String(viewsPrev));
			if(viewsNew!=0)
				$("#"+website+"Views").html($("#"+website+"Views").html()+'<font color="red">+'+String(viewsNew)+'</font>');
			if(viewsGone!=0)
				$("#"+website+"Views").html($("#"+website+"Views").html()+'<font color="green">-'+String(viewsGone)+'</font>');
			$("#"+website+"Comments").html(String(commentsPrev));
			if(commentsNew!=0)
			$("#"+website+"Comments").html($("#"+website+"Comments").html()+'<font color="red">+'+String(commentsNew)+'</font>');
			if(commentsGone!=0)
			$("#"+website+"Comments").html($("#"+website+"Comments").html()+'<font color="green">-'+String(commentsGone)+'</font>');
			if(localStorage.getItem(website+"Login")=='-1'){
				$("#"+website+"Views").html('<a class="warning" target="_blank" href="'+linkLists[website]+'">Login</a>');
				$("#"+website+"ViewsText").hide();
				$("#"+website+"Comments").hide();
				$("#"+website+"CommentsText").hide();
			}
		}
	}
	$("#totalViews").html(String(allViewsPrev));
	if(allViewsNew!=0){
		$("#totalViews").html($("#totalViews").html()+'<font color="red">+'+String(allViewsNew)+'</font>');
	}
	if(allViewsGone!=0){
		$("#totalViews").html($("#totalViews").html()+'<font color="green">-'+String(allViewsGone)+'</font>');
	}
	$("#totalComments").html(String(allCommentsPrev));
	if(allCommentsNew!=0){
		$("#totalComments").html($("#totalComments").html()+'<font color="red">+'+String(allCommentsNew)+'</font>');
	}
	if(allCommentsGone!=0){
		$("#totalComments").html($("#totalComments").html()+'<font color="green">-'+String(allCommentsGone)+'</font>');
	}
	$('.info_display').each(function(){
		$(this).css("font-size",String(min(222/$(this).text().length,18))+"px");
	});
}

function onNum(){
	var onNum=0;
	for(var i=0;i<websiteList.length;i++){
		if(isOn(websiteList[i])){
			onNum++;
		}
	}
	return onNum;
}

function getItem(key){
	return localStorage.getItem(key);
}

function setItem(key,item){
	localStorage.setItem(key,item);
}