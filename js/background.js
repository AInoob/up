var websiteId={
	'youtube'	:	0,
	'youku'		:	1,
	'bilibili'	:	2,
	'acfun'		:	3
}

var updateTime=0;
var websiteList=['youtube','youku','bilibili','acfun'];
var defaultValues=[
	['briefData','[]'],	
	['youtube',''],
	['youku','1'],
	['bilibili','1'],
	['acfun','1'],
	['notifyViews','-1'],
	['notifyComments','1'],
	['youtubeReadTime',0],
	['youkuReadTime',0],
	['bilibiliReadTime',0],
	['acfunReadTime',0],
	['updateInterval',30],
	['newCommentsBlock','1'],
	['trendGraphBlock','1']
];
var websiteOMG=[
	{
		'fetch'			:	fetchWebsite,
		'url'			:	'https://www.youtube.com/my_videos?o=U&r=',
		'notLogin'		:	notLoginYoutube,
		'parse'			:	parseYoutube,
		'verifyData'	:	function(){return true;},
		'hasNextPage'	:	function(){return false;}
	},
	{
		'fetch'			:	fetchWebsite,
		'url'			:	'http://i.youku.com/u/videos?page=',
		'notLogin'		:	notLoginYouku,
		'parse'			:	parseYouku,
		'verifyData'	:	function(page){return $($(page).find('.databox')).find('table').length==1;},
		'hasNextPage'	:	function(){return true;}
		
	},
	{
		'fetch'			:	fetchWebsite,
		'url'			:	'http://member.bilibili.com/video_manage.do?act=video_list&page=',
		'notLogin'		:	notLoginBilibili,
		'parse'			:	parseBilibili,
		'verifyData'	:	function(){return true;},
		'hasNextPage'	:	function(listRawRaw){var ListRaw=JSON.parse(listRawRaw);return listRaw['numPages']>listRaw['res']['page'];}
	},
	{
		'fetch'			:	fetchWebsite,
		'url'			:	'http://www.acfun.tv/member/contributeList.aspx?pageNo=',
		'notLogin'		:	notLoginAcfun,
		'parse'			:	parseAcfun,
		'verifyData'	:	function(){return true;},
		'hasNextPage'	:	function(listRaw){return listRaw['page']['totalPage']>listRaw['page']['pageNo'];}
	}
];
var websiteUpdated=[true,true,true,true];

function init(){
	for(var i=0;i<defaultValues.length;i++){
		setIfNull(defaultValues[i][0],defaultValues[i][1]);
	}
}

function remainUpdates(){
	var r=0;
	for(var i=0;i<websiteList.length;i++){
		var website=websiteList[i]
		if(isOn(website)&&(websiteUpdated[i]==false)){
			r++;
		}
	}
	return r;
}

function updateAll(){
	var temp=new Date();
	updateTime=temp.getTime();
	if(remainUpdates()==0){
		console.log("updating");
		for(var i=0;i<websiteList.length;i++){
			var website=websiteList[i]
			if(isOn(website)){
				websiteUpdated[i]=false;
				websiteOMG[i].fetch(undefined,undefined,website);
			}
		}
	}
}

function notify(){
	var r=0;
	var allViewsNew=0,
		allCommentsNew=0;
	for(var i=0;i<websiteList.length;i++){
		var website=websiteList[i];
		if(isOn(website)){
			var viewsNew=0,commentsNew=0;
			var lastReadTime=getItem(website+'ReadTime');
			var updateChanges=JSON.parse(getItem(website+'_updateChanges'));
			if(updateChanges!=null){
				for(var j=0;j<updateChanges.length;j++){
					var change=updateChanges[j];
					if(change.updateTime>lastReadTime){
						viewsNew+=change.viewsNew;
						commentsNew+=change.commentsNew;
					}
				}
			}
			allViewsNew+=viewsNew;
			allCommentsNew+=commentsNew;
		}
	}
	if(isOn("notifyViews")){
		r+=allViewsNew;
	}
	if(isOn("notifyComments")){
		r+=allCommentsNew;
	}
	if(r!=0){
		chrome.browserAction.setBadgeText({text: String(r)});
	}
	
	generateData();
	chrome.runtime.sendMessage({job: "remainUpdates"+remainUpdates()}, function(response) {});
	console.log("    remaining: "+String(remainUpdates()));
}

function generateData(){
	var briefData=[];
	var data=[];
	for(var i=0;i<websiteList.length;i++){
		var website=websiteList[i];
		if(isOn(website)){
			var viewsRead,viewsNew=0,viewsGone=0,
				commentsRead,commentsNew=0,commentsGone=0;
			var websiteData={};
			var webisiteRead=JSON.parse(localStorage.getItem(website+"ListRead"));
			var websiteNow=JSON.parse(localStorage.getItem(website+"List"));
		}
	}
}

function shrinkData(){
	for(var i=0;i<localStorage.length;i++){
		var key=localStorage.key(i);
		if(key.indexOf('history')!=-1){
			;
		}
	}
}

document.addEventListener('DOMContentLoaded', function(){
	init();
	updateAll();
	var updateInterval=parseInt(localStorage.getItem('updateInterval'));
	if(updateInterval==NaN){
		updateInterval=10;
		localStorage.setItem('updateInterval',updateInterval);
	}
	chrome.alarms.create("updateAlarm",{
		periodInMinutes: updateInterval
	});
	
	chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.job == "updateInterval"){
			chrome.alarms.clear("updateAlarm", function (wasCleared){
				if(wasCleared){
					chrome.alarms.create("updateAlarm",{
						periodInMinutes: parseInt(localStorage.getItem('updateInterval'))
					});
				}
				else{
					console.log("failed to change interval");
				}
			});
			sendResponse({updating: true});
		}
		if (request.job == "update"){
			if(remainUpdates()==0){
				updateAll();
				sendResponse({updating: true});
			}
			else{
				sendResponse({remainUpdates: remainUpdates()});
			}
		}
	});
	chrome.alarms.onAlarm.addListener(updateAll);
});

function notLoginAcfun(data){
	return data['success']!=true;
}

function notLoginBilibili(data){
	return data[0]=='<';
}

function notLoginYouku(data){
	return $(data).find(".YK_manager").length==0;
}

function notLoginYoutube(data){
	return false;
}

function fetchWebsite(i,list,website){
	if(i==null){
		i=1;
	}
	if(list==null){
		list=[];
	}
	var xhr = new XMLHttpRequest();
	var id=websiteId[website];
	$.ajax({
		url: websiteOMG[id].url+i}).done(function(data){
			if(websiteOMG[id].notLogin(data)){
				localStorage.setItem(website+"Login","-1");
				websiteUpdated[id]=true;
				notify();
				return;
			}
			else{
				localStorage.setItem(website+"Login","1");
			}
			
			page=data;
			var listRaw=page;
			var data=[listRaw,list];
			if(websiteOMG[id].verifyData(page)){
				websiteOMG[id].parse(data);
				if(websiteOMG[id].hasNextPage(listRaw)){
					websiteOMG[id].fetch(i+1,data[1],website);
				}
				else{
					localStorage.setItem(website+"List",JSON.stringify(data[1]));
					storData(website,data[1]);
					websiteUpdated[id]=true;
					notify();
				}
			}
			else{
				localStorage.setItem(website+"List",JSON.stringify(data[1]));
				storData(website,data[1]);
				websiteUpdated[id]=true;
				notify();
			}
			
		}).fail(function(){
			websiteUpdated[id]=true;
			notify();
		});
}

function storData(website,data){
	var list=[];
	var allHistoryKey=website+'_history';
	var allHistoryData=JSON.parse(getItem(allHistoryKey));
	if(allHistoryData==null){
		allHistoryData=[];
	}
	for(var j=0;j<data.length;j++){
		var key=website+'_'+data[j].id;
		list.push(key);
		var historyKey=website+'_history_'+data[j].id;
		var historyData=JSON.parse(getItem(historyKey));
		var views=data[j].views,comments=data[j].comments;
		if(historyData==null){
			historyData=[];
		}
		historyData.push({updateTime:updateTime,views:views,comments:comments});
		setItem(key,JSON.stringify(data[j]));
		setItem(historyKey,JSON.stringify(historyData));
	}
	allHistoryData.push({updateTime:updateTime,list:list});
	setItem(allHistoryKey,JSON.stringify(allHistoryData));	
	var updateChangesKey=website+'_updateChanges';
	var updateChanges=JSON.parse(getItem(updateChangesKey));
	if(updateChanges==null){
		updateChanges=[];
	}
	var dataNow=allHistoryData[allHistoryData.length-1];
	var dataThen=allHistoryData[allHistoryData.length-2];
	if(dataThen==null){
		dataThen={list:[]};
	}
	var viewsPrev=0,viewsNew=0,viewsGone=0,views=0,
		commentsPrev=0,commentsNew=0,commentsGone=0,comments=0;
	for(var i=0;i<dataNow.list.length;i++){
		var key=website+'_history'+dataNow.list[i].slice(website.length);
		var videoHistory=JSON.parse(getItem(key));
		var newData=videoHistory[videoHistory.length-1];
		var oldData=videoHistory[videoHistory.length-2];
		views+=newData.views;
		comments+=newData.comments;
		if(oldData==null){
			oldData={comments:0,views:0};
		}
		if(oldData.comments>newData.comments){
			commentsGone+=oldData.comments-newData.comments;
		}
		else if(oldData.comments<newData.comments){
			var videoInfo=JSON.parse(getItem(dataNow.list[i]));
			commentsNew+=newData.comments-oldData.comments;
			///JJJ
			// title,url,newComments,img
			var newCommentList=getItem('newCommentList');
			if(newCommentList==null){
				newCommentList='[]';
			}
			newCommentList=JSON.parse(newCommentList);
			var has=false;
			for(var j=0;j<newCommentList.length;j++){
				if(newCommentList[j].url==videoInfo.url){
					newCommentList[j].newComments=(newData.comments-oldData.comments)+newCommentList[j].newComments;
					has=true;
					break;
				}
			}
			if(!has){
				newCommentList.push({title:videoInfo.title,url:videoInfo.url,newComments:(newData.comments-oldData.comments),imageUrl:videoInfo.imageUrl,website:website});
			}
			setItem('newCommentList',JSON.stringify(newCommentList));
		}
		if(oldData.views>newData.views){
			viewsGone+=oldData.views-newData.views;
		}
		else{
			viewsNew+=newData.views-oldData.views;
		}
	}
	for(var i=0;i<dataThen.list.length;i++){
		var key=website+'_history'+dataThen.list[i].slice(website.length);
		var videoHistory=JSON.parse(getItem(key));
		var newData=videoHistory[videoHistory.length-1];
		viewsPrev+=newData.views;
		commentsPrev+=newData.comments;
		if(dataNow.list.indexOf(dataThen.list[i])==-1){
			viewsGone+=newData.views;
			commentsGone+=newData.comments;
		}
	}
	updateChanges.push({
		updateTime:updateTime,
		views:views,
		viewsPrev:viewsPrev,
		viewsNew:viewsNew,
		viewsGone:viewsGone,
		comments:comments,
		commentsPrev:commentsPrev,
		commentsNew:commentsNew,
		commentsGone:commentsGone,
	});
	setItem(updateChangesKey,JSON.stringify(updateChanges));
}

function parseYouku(data){
	page=data[0];
	data[0]=$($('#videolist',page)).children();
	for(var i=0;i<data[0].length;i++){
		var test={};
		var video=data[0][i];
		var title=$($($(video).find(".v_title")).find("a")).attr("title");
		var url=$($($(video).find(".v_title")).find("a")).attr("href");
		var imageUrl=$($(video).find(".v_thumb")).find("img").attr("src");
		var state=null;
		var numOfViews=$($($(video).find('.heat')).find("a")[0]).text();
		var numOfComments=$($($(video).find('.heat')).find("a")[1]).text();
		var numOfOutSiteViews=$($($(video).find('.heat')).find("a")[2]).text().substr($($($($(video).find('.heat')).find("a")[2]).children()[0]).text().length);
		var duration=$($(video).find(".num")[0]).text();
		var pubDate=$($(video).find(".num")[1]).text();
		var match = pubDate.match(/^(\d+)-(\d+)-(\d+) (\d+)\:(\d+)/)
		var date = new Date(match[1], match[2] - 1, match[3], match[4], match[5], 0)
		test["url"]=url;
		test["id"]=url.match(/id_(.+)==/m)[1];
		test["imageUrl"]=imageUrl;
		test["title"]=title;
		test["numOfViews"]=parseInt(numOfViews.replace(/,/g,""));
		test["views"]=parseInt(numOfViews.replace(/,/g,""));
		test["numOfOutSiteViews"]=numOfOutSiteViews;
		test["numOfComments"]=parseInt(numOfComments.replace(/,/g,""));
		test["comments"]=parseInt(numOfComments.replace(/,/g,""));
		test["duration"]=duration;
		test["pubDate"]=date.getTime();
		data[1][data[1].length]=test;
	}
}

function parseBilibili(data){
	listRaw=JSON.parse(data[0]);
	data[0]=listRaw;
	numOfVideos=data[0]['numPages']>data[0]['res']['page']?10:data[0]['numResults']%10;
	for(var i=0;i<numOfVideos;i++){
		var test={};
		var video=data[0][i];
		var title=video['title'];
		var id=video['aid'];
		var imageUrl=video['cover'];
		var state=null;
		var numOfViews=video['click'];
		var numOfComments=video['review'];
		var numOfOutSiteViews=null;
		var duration=video['duration'];
		var pubDate=video['pubdate'];
		var match = pubDate.match(/^(\d+)-(\d+)-(\d+) (\d+)\:(\d+)\:(\d+)$/)
		var date = new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6])
		test["id"]=id;
		test["url"]="http://www.bilibili.com/video/av"+id+"/";
		test["imageUrl"]=imageUrl;
		test["title"]=title;
		test["numOfViews"]=numOfViews;
		test["views"]=numOfViews;
		test["numOfOutSiteViews"]=numOfOutSiteViews;
		test["numOfComments"]=numOfComments;
		test["comments"]=numOfComments;
		test["duration"]=duration;
		test["pubDate"]=date.getTime();
		data[1][data[1].length]=test;
	}
}

function parseAcfun(data){
	for(var i=0;i<data[0]['contents'].length;i++){
		var test={};
		var video=data[0]['contents'][i];
		var title=video['title'];
		var url=video['url'];
		var imageUrl=video['titleImg'];
		var tempState=video['checkStatus'];
		var videoStatus=null;
		switch(tempState){
			case 2:
				videoStatus=3;
				break;
			case 1:
				videoStatus=2;
				break;
			case 5:
				videoStatus=1;
				break;
			default:
				videoStatus=-1;
		}
		var numOfViews=video['views'];
		var numOfComments=video['comments'];
		var numOfOutSiteViews=null;
		var duration=null;
		var pubDate=video['releaseDate'];
		var id=video['contentId'];
		test["url"]="http://www.acfun.tv/"+url;
		test['id']=id;
		test["imageUrl"]=imageUrl;
		test["title"]=title;
		test["numOfViews"]=numOfViews;
		test["views"]=numOfViews;
		test["numOfOutSiteViews"]=numOfOutSiteViews;
		test["numOfComments"]=numOfComments;
		test["comments"]=numOfComments;
		test["duration"]=duration;
		test["pubDate"]=pubDate;
		test["status"]=videoStatus;
		data[1][data[1].length]=test;
	}
}

function parseYoutube(data){
	var youtubePage=data[0];
	var start=youtubePage.indexOf("VIDEO_LIST_DISPLAY_OBJECT");
	var youtubeList=data[1];
	start=youtubePage.indexOf("[",start);
	var end=youtubePage.indexOf("]",start);
	var x=youtubePage.indexOf('"id"',start);
	var temp=youtubePage.indexOf('"html"',start);
	var back=null;
	if(temp>x)
		back=false;
	else
		back=true;
	var count=1;
	while(x!=-1&&x<end){
		x=youtubePage.indexOf(":",x);
		x=youtubePage.indexOf('"',x)+1;
		var xx=youtubePage.indexOf('"',x);
		var test={};
		var url="https://www.youtube.com/watch?v="+ainoobStringConn(youtubePage,x,xx);
		var imageUrl="https://i.ytimg.com/vi/"+ainoobStringConn(youtubePage,x,xx)+"/default.jpg";
		if(back){
			x=temp;
			temp=youtubePage.indexOf('"html"',temp+1);
		}
		x=youtubePage.indexOf('video-time',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('u003e',x);
		if(x==-1){
			break;
		}
		x+=5;
		xx=youtubePage.indexOf('u003c',x);
		var duration=ainoobStringConn(youtubePage,x,xx-1);
		x=youtubePage.indexOf('vm-video-title-content',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('data-sessionlink',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('u003e',x);
		if(x==-1){
			break;
		}
		x+=5;
		xx=youtubePage.indexOf('u003c',x);
		var title=ainoobStringConn(youtubePage,x,xx-1);
		x=youtubePage.indexOf('data-timestamp',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('"',x);
		if(x==-1){
			break;
		}
		x+=1;
		xx=youtubePage.indexOf('\\"',x);
		var pubDate=ainoobStringConn(youtubePage,x,xx);
		x=youtubePage.indexOf('vm-video-metric-value',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('u003e\\n',x);
		if(x==-1){
			break;
		}
		x+=7;
		xx=youtubePage.indexOf('\\n',x);
		var numOfComments=ainoobStringConn(youtubePage,x,xx).replace(/ /g, "");
		x=youtubePage.indexOf('vm-video-metric-value',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('u003e\\n',x);
		if(x==-1){
			break;
		}
		x+=7;
		xx=youtubePage.indexOf('\\n',x);
		var numOfLikes=ainoobStringConn(youtubePage,x,xx).replace(/ /g, "");
		x=youtubePage.indexOf('vm-video-metric-value',x);
		if(x==-1){
			break;
		}
		x=youtubePage.indexOf('u003e\\n',x);
		if(x==-1){
			break;
		}
		x+=7;
		xx=youtubePage.indexOf('\\n',x);
		var numOfDislikes=ainoobStringConn(youtubePage,x,xx).replace(/ /g, "");
		x=youtubePage.indexOf('vm-video-side-view-count',x);
		if(x==-1){
			break;
		}
		xx=youtubePage.indexOf('view',x+24);
		x=xx-18;
		if(x==-11){
			break;
		}
		var numOfViews=ainoobStringConn(youtubePage,x,xx).replace(/ /g, "");
		var state=null;
		var numOfOutSiteViews=null;
		test["url"]=url;
		test['id']=url.match(/v=(.+)/m)[1];
		test["imageUrl"]=imageUrl;
		test["title"]=title;
		test["numOfViews"]=parseInt(numOfViews.replace(/,/g,""));
		test["views"]=parseInt(numOfViews.replace(/,/g,""));
		test["numOfOutSiteViews"]=numOfOutSiteViews;
		test["numOfComments"]=parseInt(numOfComments.replace(/,/g,""));
		test["comments"]=parseInt(numOfComments.replace(/,/g,""));
		test["numOfLikes"]=numOfLikes;
		test["numOfDislikes"]=numOfDislikes;
		test["duration"]=duration;
		test["pubDate"]=pubDate*1000;
		youtubeList[youtubeList.length]=test;
		if(back){
			x=youtubePage.indexOf('"id"',x);
		}
		x=youtubePage.indexOf('"id"',x+1);
		count++;
	}
}

function isOn(s){
	return localStorage.getItem(s)!='-1';
}

function setIfNull(s,o){
	if(localStorage.getItem(s)==null){
		localStorage.setItem(s,o);
	}
}

function ainoobStringConn(s,a,b){
	var r="";
	for(var i=a;i<b;i++){
		r+=s.charAt(i);
	}
	return r;
}

function getItem(key){
	return localStorage.getItem(key);
}

function setItem(key,item){
	localStorage.setItem(key,item);
}


