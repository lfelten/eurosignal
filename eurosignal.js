/**
 * Copyright (C) lothar.felten@gmx.net
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var tone = [];
var current;
var queue;
var running=false;
var needinit=true;
var timeout;

window.onload = function(){
	document.getElementById("pad").value="";
	document.getElementById("traffic").value=25;
}

function init(){
	needinit=false;
	current=0;
	queue = Array();
	var actx = new AudioContext();
	var tonefrequencies = [979.8, 903.1, 832.5, 767.4, 707.4, 652.0, 601.0, 554.0, 510.7, 470.8, 1062.9, 1153.1, 1153.1];//f0-f9, repeat (10), free(11), free (long)(12)
	/* generate samples  */
	for(var j=0; j<13; j++){
		var samples = Math.ceil(actx.sampleRate/tonefrequencies[j]);
		//console.log("f="+tonefrequencies[j]+" samples:"+samples+" ");
		var array = new Float32Array(samples);
		for(var i=0; i < array.length; i++) {
			array[i] = (Math.sin(i*2*Math.PI*tonefrequencies[j]/actx.sampleRate));
		}
		var sink = actx.createBufferSource();
		var buf = actx.createBuffer(1, array.length, actx.sampleRate);
		buf.copyToChannel(array, 0);
		sink.buffer = buf;
		sink.loop = true;
		tone[j] = actx.createGain();
		sink.connect(tone[j]);
		tone[j].gain.value=0;
		tone[j].connect(actx.destination);
		sink.start();
	}
}

function stop(){
	tone[current].gain.value=0;
	queue.length=0;
	document.getElementById("pad").value="";
}

function start(){
	if(needinit)init();
	document.getElementById("pad").value="";
	fill_queue();
	timeout = setTimeout(loop, 100);
}

function loop(){
	clearTimeout(timeout);
	var next = queue.shift();
	if(next == undefined){
		//console.log("queue empty");
		tone[current].gain.value=0;
		return;
	}
	//console.log("tone: "+next+" queue: "+queue+" length: "+queue.length);
	tone[current].gain.value=0;
	tone[next].gain.value=(document.getElementById("volume").value)/10;
	current = next;
	var t = 100;
	if(current==11)t=220;
	else if(current==12)t=720;
	if(queue.length<1)fill_queue();
	timeout = setTimeout(loop, t);
}

function queue_number(n){
	if(n<100000)return;
	if(n>899999)return;
	var textarea = document.getElementById("pad");
	textarea.value+=n+"\n";
	textarea.scrollTop = textarea.scrollHeight;
	var s = n.toString();
	var last;
	for(var i=0;i<6;i++){
		if(last==s[i]){
			last='A';
			queue.push(10);
		}
		else{
			last=s[i];
			queue.push(s[i]);
		}
	}
	queue.push(11);//free 220ms
}

function queue_idle(){
	var textarea = document.getElementById("pad");
	textarea.value+="-idle-\n";
	textarea.scrollTop = textarea.scrollHeight;
	queue.push(10);//repeat
	queue.push(12);//long free 720ms
}

function fill_queue(){
	var slots = 20;
	var mynumber = document.getElementById("mynumber").value;
	var myslot = Math.floor(Math.random()*slots);
	var traffic = document.getElementById("traffic").value;
	//console.log("traffic: "+traffic+" myslot: "+myslot+" mynumber: "+mynumber);
	for(var i=0;i<slots;i++){
		if(i==myslot)queue_number(mynumber);
		else if((Math.random()*100)<traffic) queue_number(Math.floor(Math.random()*799999)+100000);
		else queue_idle();
	}
}
