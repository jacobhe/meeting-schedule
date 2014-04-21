var now = new Date();
var aday = 24 * 60 * 60 * 1000;
var CONFIG = {
    last_message_time: Math.floor(now.getTime() / aday) * aday
    ,date: new Date().format('%Y-%m-%d')
};

var createRangeDiv = function (top) {
    var _chip = new Element('div', {
        'class': 'chip drag-add-div'
		, 'style': 'top: ' + top + 'px; left: 0%; width: 100%;'
    });
    _chip.set('html',
		['<dl class="cbrd" style="height:21px; border-color: rgb(163, 41, 41); background-color: rgb(217, 102, 102);">'
			, '<dt style="background-color: rgb(163, 41, 41);">'
				, getTimeRange(top, 21)
			, '</dt>'
			, '<dd>'
				, '<span style="cursor: pointer;" class="ca-elp120">&nbsp;</span>'
			, '</dd>'
			, '<div class="resizer">'
				, '<div class="rszr_icon">&nbsp;</div>'
			, '</div>'
		, '</dl>'].join(''));
    return _chip;
};

var getTimeRange = function (top, height) {
    var minutes1 = top / 21 * 30;
    var start_hour = Math.floor(minutes1 / 60);
    var start_minute = minutes1 % 60;

    var minutes2 = (top + height) / 21 * 30;
    var end_hour = Math.floor(minutes2 / 60);
    var end_minute = minutes2 % 60;

    return formatTime(start_hour, start_minute) + ' - ' + formatTime(end_hour, end_minute);
};

var formatTime = function (hour, minute) {
    return (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute);
};

var closeBubble = function () {
    $('calendar_bubble').setStyle('display', 'none');
    $(":w.what").set('value', '');
    $(":w.department").set('value', '');
	$(":w.name").set('value', '');
	$(":w.phone").set('value', '');
    $(":w.where").set('text', '');
    $(":w.when").set('text', '');
    $$("div.drag-add-div").destroy();
    window.removeEvent('mousedown', closeBubble);
};

var createBubble = function () {

    $('calendar_bubble').addEvent('mousedown', function (e) {
        e.stopPropagation();
    });
    $(':w.what').addEvent('keydown', function (e) {
        e.stopPropagation();
        var node = e.target.nodeName;
        if (node == "INPUT" && e.code == 13) {
            $(':w.create-button').fireEvent('click');
        }
    });
    $(':w.create-button').addEvent('click', function (e) {
        e.stopPropagation();
        var bubble = $('calendar_bubble');
        var timeRanges = bubble.getElementById(':w.when').get('text').split('-');
        var where = bubble.getElementById(':w.where').get('text');
        var what = bubble.getElementById(':w.what').get('value');
        var department = bubble.getElementById(':w.department').get('value');
        var name = bubble.getElementById(':w.name').get('value');
        var phone = bubble.getElementById(':w.phone').get('value');
        if (what.trim() == '') {
            return alert('请填写会议主题');
        }
        if (department.trim() == '') {
            return alert('请填写您的部门');
        }
        if (name.trim() == '') {
            return alert('请填写您的名字');
        }
        if (phone.trim() == '') {
            return alert('请填写您的分机号码');
        }
        schedule.emit('add-meeting', JSON.encode({
            'title': what
			, 'startTime': timeRanges[0].trim()
			, 'endTime': timeRanges[1].trim()
			, 'department': department
			, 'room': where
            , 'date': CONFIG.date
			, 'name': name
			, 'phone': phone
        }));
        closeBubble();
    });
    $('bubbleClose:3').addEvent('click', function (e) {
        closeBubble();
    });
};

var showBubble = function (bubbleTop, bubbleLeft, time, room) {
    //show the calendar bubble
    if (window.innerWidth - bubbleLeft < 500 && bubbleTop < 0) {
        $('prong:3').setStyle('display', 'none');
        bubbleLeft = window.innerWidth - 600;
        bubbleTop += 276;
    } else if (window.innerWidth - bubbleLeft < 500) {
        $('prong:3').setStyle('display', 'none');
        bubbleLeft = window.innerWidth - 600;
        bubbleTop += 64;
    } else if (bubbleTop < 0) {
        $('prong:3').setStyle('display', 'none');
        bubbleTop += 276;
    }
    $(':w.when').set('text', time);
    $(':w.where').set('text', room);

    $('calendar_bubble').setStyles({
        'display': 'block',
        'left': bubbleLeft,
        'top': bubbleTop
    });
    $(':w.what').focus();
    window.addEvent('mousedown', closeBubble);
}

var dragToAdd = function (e) {
    if ($('calendar_bubble').getStyle('display') != 'none') {
        return;
    }
    var self = this;

    // 当前鼠标相对父容器的y坐标
    var layerY = e.page.y - self.getPosition().y;

    // 计算当前鼠标点击的格子的顶端坐标
    var origin_top = layerY - layerY % 21;

    var dragObj = null;
    var ct = self.getElement("div.tg-gutter");

    var _chip = createRangeDiv(origin_top);
    _chip.inject(ct);

    $('prong:3').setStyle('display', 'block');
    dragObj = _chip.getChildren("dl")[0];

    document.addEvent('mousemove', function (e) {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        } else {
            document.selection.empty();
        }

        // 计算鼠标指针所在格子距离容器的顶端位置
        var c_layer_y = e.page.y - self.getPosition().y;
        var current_top = c_layer_y - c_layer_y % 21;
        var height = Math.abs(current_top - origin_top) + 21;

        if (current_top == origin_top) {
            dragObj.getParent().setStyle('top', origin_top);
        }
        if (current_top < origin_top) {
            dragObj.getParent().setStyle('top', current_top);
        }
        dragObj.setStyle('height', height);
        dragObj.getChildren("dt")[0].set('text', getTimeRange(current_top > origin_top ? origin_top : current_top, height));
    });
    document.addEvent('mouseup', function (e) {
        document.removeEvents('mousemove').removeEvents('mouseup');
        var pos = dragObj.getPosition();
        var bubbleTop = pos.y - 276;
        var bubbleLeft = pos.x;
        showBubble(bubbleTop, bubbleLeft, dragObj.getChildren("dt")[0].get('text'), dragObj.getParent('td').get('day'));
        dragObj = null;
    });
};

dragToEdit = function (div) {

    var parent = div.getParent('td');
    var copy = null;
    var dw = Math.floor(div.scrollHeight.toInt() / 21);

    div.addEvent('mousedown', function (e) {
        e.stopPropagation();
        var self = this;

        var origin_top = div.getStyle('top').toInt();
        var start_y = e.client.y;
        var start_x = e.client.x;
        var height = div.getElements('dl')[0].getStyle('height').toInt() + 3;
        var left = div.getParent('td.tg-col').getPosition().x;
        var origin_left = left;
        var right = left + div.getParent('td.tg-col').getSize().x;

        document.addEvent('mousemove', function (e) {
            var td;

            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else {
                document.selection.empty();
            }

            // 计算鼠标指针所在格子距离容器的顶端位置
            var dist = Math.floor((e.client.y - start_y) / 21);
            var current_top = origin_top + dist * 21;
            div.setStyle('top', current_top);
            div.getElements('dt')[0].set('text', getTimeRange(current_top, height));

            if (e.client.x < left || e.client.x > right) {
                td = e.target.getParent('td.tg-col');
                if (td) {
                    div = div.dispose();
                    container = td.getElement('div.tg-gutter');
                    div.inject(container);
                    schedule.emit('change-room', JSON.encode({ uuid: div.get('id'), room: td.get('day') }));
                    left = td.getPosition().x;
                    right = left + td.getSize().x;
                }
            }

            schedule.emit('move-meeting', JSON.encode({ uuid: div.get('id'), top: current_top, time: div.getElements('dt')[0].get('text') }));

        });
        document.addEvent('mouseup', function (e) {

            document.removeEvents('mousemove').removeEvents('mouseup');
            if (origin_top === div.getStyle('top').toInt() && origin_left === div.getParent('td.tg-col').getPosition().x) {
                return;
            }
            var time = div.getElements('dt')[0].get('text').split('-');
            var meeting = {
                'uuid': div.get('id')
				, 'title': div.getElement("span.mt-title").get('text').trim()
                , 'department': div.getElement("span.mt-department").get('text').trim()
				, 'name': div.getElement("span.mt-name").get('text').trim()
				, 'phone': div.getElement("span.mt-phone").get('text').trim()
		        , 'startTime': time[0].trim()
		        , 'endTime': time[1].trim()
				, 'room': div.getParent('td').get('day')
                , 'date': CONFIG.date
            };
            schedule.emit('update-meeting', JSON.encode(meeting));
        });
    });
};

window.addEvent('domready', function () {
    $('wk_scrolltimedevents').scrollTo(0, 42 * 8);
    $$('td.tg-col').each(function (td) {
        td.addEvent('mousedown', dragToAdd);
    });
    $('calendar_bubble_read_only').addEvent('mousedown', function (e) {
        e.stopPropagation();
    });
    new DatePicker('.select-date', { pickerClass: 'datepicker_vista', format: 'Y-m-d', inputOutputFormat: 'Y-m-d', onSelect: function (date) {
        schedule.emit('change-date', date.format('%Y-%m-%d'));
    } 
    });
    createBubble();

    // 登录窗口
    var dialogCme = new DialogCME({
        'alert': false,
        'closeButton': true,
        'title': '登录',
        'content': "<p>请输入用户名和密码</p><label for='username'>用户名： </label><input id='username' type='text'><br><br><label for='password'>密码： </label><input id='password' type='password'>",
        'submit': {
            'exists': true,
            'value': '登入',
            'fn': function (e) {
                this.hide();
            }
        },
        'cancel': {
            'exists': true,
            'value': '取消',
            'fn': function (e) {
                this.hide();
            }
        }
    });

    $('login').addEvent('click', function (e) {
        e.stop();
        dialogCme.show();
    });
});

var hostname = window.location.hostname;
//var chat = io.connect('http://' + hostname + '/chat')
var schedule = io.connect('http://' + hostname + '/schedule');

//chat.on('connect', function () {
//	chat.emit('set nickname', 'jacob');
//	chat.on('ready', function () {
//		chat.emit('msg', 'good morning!');
//	});
//});

var createMeetingDiv = function (meeting) {
    var title = meeting.title;
    var department = meeting.department;
	var name = meeting.name;
	var phone = meeting.phone;
    var startTime = meeting.startTime;
    var startTimeArray = startTime.split(':');
    var startHour = parseInt(startTimeArray[0], 10);
    var startMinute = parseInt(startTimeArray[1], 10);
    var endTime = meeting.endTime;
    var endTimeArray = endTime.split(':');
    var endHour = parseInt(endTimeArray[0], 10);
    var endMinute = parseInt(endTimeArray[1], 10);
    var height = 42 * (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60 - 3;

    return new Element('div',
		{ 'id': meeting.uuid
			, 'class': 'chip chip-normal'
			, 'style': 'top: ' + (42 * startHour + 42 * startMinute / 60) + 'px; left: 0%; width: 100%;'
		})
	.set('html',
		['<dl style="height:' + height + 'px; border-color: rgb(122,53,18); background-color: #c7561e;" class="cbrd">'
			, '<dt style="background-color: rgb(122,53,18);">'
				, startTime
				, ' - '
				, endTime
			, '</dt>'
			, '<dd>'
				, '<span class="ca-elp120">'
					, '<span class="mt-title">'
						, title
					, '</span>'
					, '<br>'
					, '<span class="mt-department">'
						, department
					, '</span>'
					, '<br>'
					, '<span class="mt-name">'
						, name
					, '</span>'
					, '<br>'
					, '<span class="mt-phone">'
						, phone
					, '</span>'
				, '</span>'
			, '</dd>'
			, '<div class="resizer">'
				, '<div class="rszr-icon">&nbsp;</div>'
			, '</div>'
		, '</dl>'].join(''))
        .addEvent('dblclick', showReadOnlyBubble)
        .store('uuid', meeting.uuid);
};

var bindResizerEvents = function (resizer, meeting) {
    resizer.addEvent('mouseover', function (e) {
        e.stop();
        this.getElement('div.rszr-icon').removeClass('rszr-icon').addClass('rszr-icon-hover');
    })
        .addEvent('mouseout', function (e) {
            e.stop();
            this.getElement('div.rszr-icon-hover').removeClass('rszr-icon-hover').addClass('rszr-icon');
        })
        .addEvent('mousedown', function (e) {
            e.stop();
            var height;
            var dl = this.getParent('dl.cbrd');
            document.addEvent('mousemove', function (e) {
                e.stop();
                height = e.client.y - dl.getPosition().y;
                if (height < 0) {
                    height = 0;
                }
                height = height - height % 21;

                height = height + 21;
                dl.getElement('dt').set('text', getTimeRange(dl.getParent('div.chip-normal').getStyle('top').toInt(), height));
                height = height - 3;
                dl.setStyle('height', height);
                schedule.emit('resize-meeting', JSON.encode({ uuid: meeting.uuid, height: height }));
            })
            .addEvent('mouseup', function (e) {
                var startTime = dl.getElement('dt').get('text').split('-').splice(0, 1)[0].trim();
                var startTimeArray = startTime.split(':');
                var startHour = parseInt(startTimeArray[0], 10);
                var startMinute = parseInt(startTimeArray[1], 10);
                var minutes
					, newEndHour
                    , newEndMinute
                    , newEndTime;

                e.stop();
                document.removeEvents('mousemove');
                document.removeEvents('mouseup');
                minutes = startHour * 60 + startMinute + (height + 3) / 21 * 30;
                newEndHour = Math.floor(minutes / 60);
                newEndMinute = minutes % 60;
                newEndTime = (newEndHour < 10 ? '0' + newEndHour : newEndHour) + ':' + (newEndMinute == 0 ? '00' : '30');
                meeting.startTime = startTime;
                meeting.endTime = newEndTime;
                schedule.emit('update-meeting', JSON.encode(meeting));
            });
        });
};

schedule.on('init-meeting', function (meeting) {
    if (meeting.error) {
        alert('获取数据出错');
    } else {
        var ct = $$('td[day="' + meeting.room + '"] div.tg-gutter')[0];
        var newel = createMeetingDiv(meeting).inject(ct);
        dragToEdit(newel);
        bindResizerEvents(newel.getElement('div.resizer'), meeting);
    }
});

schedule.on('new-meeting', function (meeting) {
    if (meeting.error) {
        alert('新增会议出错');
    } else {
        var ct = $$('td[day="' + meeting.room + '"] div.tg-gutter')[0];
        var newel = createMeetingDiv(meeting).inject(ct);
        dragToEdit(newel);
        newel.addEvent('dblclick', showReadOnlyBubble);
        newel.store('uuid', meeting.uuid);
        bindResizerEvents(newel.getElement('div.resizer'), meeting);
    }
});

schedule.on('resize-meeting', function (data) {

    var dl = $(data.uuid).getElement('dl.cbrd');

    dl.setStyle('height', data.height);
});

schedule.on('move-meeting', function (data) {
    $(data.uuid).setStyle('top', data.top).getElement("dt").set('text', '   ' + data.time);
});
schedule.on('update-meeting', function (meeting) {
    if (meeting.error) {
        alert('更新会议出错');
    } else {
        $(meeting.uuid).dispose()
            .inject($$('td[day="' + meeting.room + '"] div.tg-gutter')[0])
            .getElement('dl.cbrd').setStyle('height', calculateHeight(meeting))
            .getElement("dt").set('text', '   ' + meeting.startTime + ' - ' + meeting.endTime);
    }
});

schedule.on('change-room', function (data) {
    $(data.uuid).dispose().inject($$('td[day="' + data.room + '"]')[0].getElement('div.tg-gutter'));
});
schedule.on('delete-meeting', function (data) {
    if (data.error) {
        alert('删除会议出错');
    } else {
        $(data.uuid).destroy();
    }
});
schedule.on('change-date', function (data) {
    if (data.error) {
        alert('获取数据出错');
        $('select-date').set('value', CONFIG.date);
    } else {
        $$('div.chip-normal').each(function (div) {
            div.destroy();
        });
        CONFIG.date = $('select-date').get('value');
    }
});

schedule.on('connect', function () {
    CONFIG.date = new Date().format('%Y-%m-%d');
    $('select-date').set('value', CONFIG.date);
    $$('div.chip-normal').each(function (el) {
        el.destroy();
    });
});

function calculateHeight(meeting) {
    var startTime = meeting.startTime;
    var startTimeArray = startTime.split(':');
    var startHour = parseInt(startTimeArray[0], 10);
    var startMinute = parseInt(startTimeArray[1], 10);
    var endTime = meeting.endTime;
    var endTimeArray = endTime.split(':');
    var endHour = parseInt(endTimeArray[0], 10);
    var endMinute = parseInt(endTimeArray[1], 10);
    var height = 42 * (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60 - 3;
    return height;
}

function showReadOnlyBubble(e) {
    e.stop();
    var bubble = $('calendar_bubble_read_only');
    var div = e.target.getParent('div.chip-normal') || e.target;
    var position = div.getPosition();
    var x = position.x;
    var y = position.y - 216;
    var docx = document.getSize().x;
    if (x + 420 > docx) {
        x = docx - 420;
        y = y + 72;
        $('read:prong:3').setStyle('display', 'none');
    }
    if (y < 0) {
        y = 47;
        $('read:prong:3').setStyle('display', 'none');
    } else {
        $('read:prong:3').setStyle('display', '');
    }

    bubble.getElementById('read:w.when').set('text', div.getElement('dt').get('text').trim());
    bubble.getElementById('read:w.what').set('text', div.getElement('span.mt-title').get('text').trim());
    bubble.getElementById('read:w.department').set('text', div.getElement('span.mt-department').get('text').trim());
	bubble.getElementById('read:w.name').set('text', div.getElement('span.mt-name').get('text').trim());
	bubble.getElementById('read:w.phone').set('text', div.getElement('span.mt-phone').get('text').trim());
    bubble.getElementById('read:w.where').set('text', div.getParent('td').get('day'));
    bubble.setStyles({
        'display': ''
        , 'left': x
        , 'top': y
    });
    bubble.getElement('#delete-meeting')
        .store('uuid', this.retrieve('uuid'))
        .removeEvents('click')
        .addEvent('click', function (e) {
            e.stop();
            var uuid = this.retrieve('uuid');
            //$(uuid).destroy();
            bubble.setStyle('display', 'none');
            schedule.emit('delete-meeting', JSON.encode({ uuid: uuid, date: CONFIG.date }));
        });
}