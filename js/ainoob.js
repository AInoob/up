var displayData=null;
var websiteList=['youtube','youku','bilibili','acfun'];
function init(){
	var params={};window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,function(str,key,value){params[key] = value;});
	$('#graphType').change(displayTrendGraph);
}
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function displayTrendGraph(){
	var type=$('#graphType')[0].value;
	console.log(type);
	var trendGraphBlock=$('#trendGraphBlock')[0];
	trendGraphBlock.innerHTML="<h1>Trend Graph</h1>";
	var trendGraph="";
	trendGraphBlock.innerHTML+='<div id="totalTrendGraph" class="trendGraph"></div>';
	trendGraphBlock.innerHTML+='<div id="subTrendGraph" class="trendGraph"></div>';
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
				if(cursorList[i]>=totalDataRaw[i].length){
					totalTemp+=totalDataRaw[i][totalDataRaw.length][type];
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

function isOn(s){
	return localStorage.getItem(s)!='-1';
}

document.addEventListener('DOMContentLoaded', function(){
	init();
	displayTrendGraph();
});