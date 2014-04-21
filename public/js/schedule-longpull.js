/*jslint vars: true, nomen: true */
/*global window, document, $, EJS, login_user, alert */

$(function () {
    'use strict';

    $.ajaxSetup({
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        cache: false,
        error: function (jqXHR, textStatus, errorThrown) {
            alert('出现错误！');
        }
    });

    var aday = 24 * 60 * 60 * 1000;
    var CONFIG = {
        last_message_time: new Date().getTime(),
        date: $.datepicker.formatDate('yy-mm-dd', new Date()),
        cell_height: 42,
        table_height: 420
    };

    var __departments = null;
    var __meetings = [];

    var editMeetingDialog;
    var passwordConfirmDialog;
    var passwordConfirmDialogCallback = null;

    function isMeetingConflict(start, end, where, _id) {

        var i;
        var divs = $('.chip-normal');
        var when;
        var time;
        var startTime;
        var endTime;
        var where2;
        var _id2;
        var div;

        start = parseInt(start.replace(/:/ig, ''), 10);
        end = parseInt(end.replace(/:/ig, ''), 10);

        for (i = 0; i < divs.length; i += 1) {
            div = $(divs[i]);
            when = $('span.mt-label-time', div).text();
            where2 = div.parents('td').attr('room');
            _id2 = div.attr('id');
            time = when.split('-');
            startTime = parseInt($.trim(time[0]).replace(/:/ig, ''), 10);
            endTime = parseInt($.trim(time[1]).replace(/:/ig, ''), 10);
            if (!(startTime >= end || endTime <= start) && where === where2 && _id !== _id2) {
                return true;
            }
        }
        return false;
    }

    function createEquipmentDialog() {

        var equipment_dialog = $('#equiment-dialog');
        equipment_dialog.append(new EJS({ url: '/templates/select-equipment-dialog.ejs' }).render());

        var onOK = function (e) {
            var self = $(this);
            var equipments = [];
            $('.ck-equipments:checked', self).each(function (i, ck) {
                equipments.push($(ck).val());
            });
            self.trigger('select-equipment', { equipments: equipments });
            self.dialog('close');
        };

        var onCancel = function (e) {
            $(this).dialog('close');
        };

        var onClose = function (e) {
            $('.ck-equipments', $(this)).each(function (i, ck) {
                $(ck).attr('checked', false).attr('disabled', false);
            });
        };

        return equipment_dialog.dialog({
            title: '选择设备',
            modal: true,
            autoOpen: false,
            close: onClose,
            buttons: [
                {
                    text: "确定",
                    click: onOK
                },
                {
                    text: "取消",
                    click: onCancel
                }
            ]
        });
    }

    function createEditMeetingDialog() {

        var dialog_div = $('#edit-meeting-dialog');
        dialog_div.append(new EJS({ url: '/templates/meeting-dialog.ejs' }).render());

        var onCreate = function () {
            var edit_meeting_dialog = $(this);
            var equipment_dialog;

            dialog_div.find('.form-horizontal').validate({
                errorPlacement: function (error, element) {
                    error.appendTo(element.next("span.help-inline"));
                    element.parents('.control-group').addClass('error');
                },
                success: function (label) {
                    label.parents('.control-group').removeClass('error');
                    label.remove();
                },
                rules: {
                    meetingRoom: 'required',
                    title: 'required',
                    department: 'required',
                    username: 'required',
                    phone: 'required'
                },
                submitHandler: function (form) {

                    var start = $.trim($('[id="startTime"]', form).val());
                    var end = $.trim($('[id="endTime"]', form).val());
                    var where = $.trim($('[id="meetingRoom"]', form).val());
                    var what = $.trim($('[id="title"]', form).val());
                    var department = $.trim($('[id="department"]', form).val());
                    var name = $.trim($('[id="username"]', form).val());
                    var phone = $.trim($('[id="phone"]', form).val());
                    var _id = edit_meeting_dialog.data('_id');
                    var password = Math.floor(Math.random() * 10000);
                    var equipments = $('[id="equipmentList"]', form).text().split(', ');

                    if (parseInt(end.replace(/:/ig, ''), 10) <= parseInt(start.replace(/:/ig, ''), 10)) {
                        alert('结束时间不能小于开始时间！');
                        return;
                    }

                    if (isMeetingConflict(start, end, where, _id)) {
                        alert('会议时间和地点与其它会议冲突！');
                        return;
                    }

                    var meeting = {
                        '_id': _id,
                        'title': what,
                        'startTime': start,
                        'endTime': end,
                        'department': department,
                        'name': name,
                        'phone': phone,
                        'room': where,
                        'date': CONFIG.date,
                        'scope': 0,
                        'equipments': equipments
                    };
                    if (!_id) {
                        meeting.password = password;
                    }

                    $.ajax({
                        url: _id ? './update' : './insert',
                        success: function (data) {
                            if (data.error) {
                                alert(_id ? '修改会议出错' : '添加会议出错');
                            } else {
                                edit_meeting_dialog.dialog("close");
                                if (data.password) {
                                    alert('你好，预定成功。你的预定密码为：' + data.password + '。请记录此密码作为修改或删除会议时使用。');
                                }
                            }
                        },
                        data: JSON.stringify(meeting)
                    });
                }
            });

            if (!login_user) {
                $('id=["department"]', edit_meeting_dialog).change(function () {
                    var department = $(this).val();
                    var i;
                    var level = 0;
                    if (__departments) {
                        for (i = 0; i < __departments.length; i += 1) {
                            if (__departments[i].name === department) {
                                level = __departments[i].level;
                                break;
                            }
                        }
                    }
                    if (level <= -3) {
                        $(this).val('');
                        alert('你好，你的预订权限已经被锁定，请与管理员联系！前台分机号码：13802883008-6500/6501或者86003058-0');
                    }
                });
            }

            $('[id="meetingRoom"]', edit_meeting_dialog).change(function () {
                $('[id="equipmentList"]', edit_meeting_dialog).val('');
            });

            $('[id="startTime"]', edit_meeting_dialog).change(function () {
                $('[id="equipmentList"]', edit_meeting_dialog).val('');
            });

            $('[id="endTime"]', edit_meeting_dialog).change(function () {
                $('[id="equipmentList"]', edit_meeting_dialog).val('');
            });

            $('[id="equipment"]', edit_meeting_dialog).click(function (e) {
                e.preventDefault();
                var i, j;
                var _id = edit_meeting_dialog.data('_id');
                var start = $('[id="startTime"]', edit_meeting_dialog).val();
                var end = $('[id="endTime"]', edit_meeting_dialog).val();
                var where = $('[id="meetingRoom"]', edit_meeting_dialog).val();
                var unavailable_equipments = {};
                var meeting;
                var equipment;

                if (__meetings) {
                    for (i = 0; i < __meetings.length; i += 1) {
                        meeting = __meetings[i];
                        if (meeting.endTime > start && meeting.startTime < end && meeting._id !== _id) {
                            for (j = 0; j < meeting.equipments.length; j += 1) {
                                equipment = meeting.equipments[j];
                                unavailable_equipments[equipment] = true;
                            }
                        }
                    }
                }

                if (!equipment_dialog) {
                    equipment_dialog = createEquipmentDialog();
                    equipment_dialog.on('select-equipment', function (e, data) {
                        $('[id="equipmentList"]', edit_meeting_dialog).text(data.equipments.join(', '));
                    });
                }

                $('.ck-equipments', equipment_dialog).each(function (i, ck) {
                    ck = $(ck);
                    if (ck.attr('rooms').indexOf(where) === -1 || unavailable_equipments[ck.val()]) {
                        ck.attr('disabled', true);
                    }
                });

                equipment_dialog.dialog('open');
            });
        };

        var onOK = function () {

            dialog_div.find('.form-horizontal').submit();
        };

        var onClose = function (e) {
            var self = $(this);
            self.removeData('_id');
            $('[id="startTime"]', self).val('');
            $('[id="endTime"]', self).val('');
            $('[id="meetingRoom"]', self).val('');
            $('[id="title"]', self).val('');
            $('[id="department"]', self).val('');
            $('[id="username"]', self).val('');
            $('[id="phone"]', self).val('');
            $('[id="equipmentList"]', self).text('');
        };

        var onCancel = function (e) {
            $(this).dialog('close');
        };

        return dialog_div.dialog({
            autoOpen: false,
            modal: true,
            create: onCreate,
            close: onClose,
            width: 550,
            buttons: [
                {
                    text: "确定",
                    click: onOK
                },
                {
                    text: "取消",
                    click: onCancel
                }
            ]
        });
    }

    function showMeetingDialog(_id) {

        var meeting_div;
        var time;

        if (!editMeetingDialog) {
            editMeetingDialog = createEditMeetingDialog();
        }

        if (_id) {
            meeting_div = $('#' + _id);
            editMeetingDialog.data('_id', _id);
            time = $('span.mt-label-time', meeting_div).text().split('-');
            editMeetingDialog.dialog("option", "title", "编辑会议预订");
            $('[id="startTime"]', editMeetingDialog).val($.trim(time[0]));
            $('[id="endTime"]', editMeetingDialog).val($.trim(time[1]));
            $('[id="meetingRoom"]', editMeetingDialog).val(meeting_div.parents('td').attr('room'));
            $('[id="title"]', editMeetingDialog).val($.trim($("span.mt-title", meeting_div).text()));
            $('[id="department"]', editMeetingDialog).val($.trim($("span.mt-department", meeting_div).text()));
            $('[id="username"]', editMeetingDialog).val($.trim($("span.mt-name", meeting_div).text()));
            $('[id="phone"]', editMeetingDialog).val($.trim($("span.mt-phone", meeting_div).text()));
            $('[id="equipmentList"]', editMeetingDialog).text($.trim($("span.mt-equipments", meeting_div).text()));
        } else {
            editMeetingDialog.dialog("option", "title", "添加会议预订");
            $('[id="startTime"]', editMeetingDialog).val('09:00');
            $('[id="endTime"]', editMeetingDialog).val('10:00');
        }
        editMeetingDialog.dialog('open');
    }

    function createPasswordConfirmDialog() {

        var password_confirm_dialog = $('#password-confirm-dialog');
        password_confirm_dialog.append(new EJS({ url: '/templates/password-confirm-dialog.ejs' }).render());

        var onOK = function (e) {
            var self = $(this);
            var _id = self.data('_id');
            var password = $.trim($('#confirmPassword', self).val());
            $.ajax({
                url: './confirm-password',
                success: function (data) {
                    if (data.error) {
                        alert('密码错误');
                    } else {
                        self.trigger('verified');
                        self.dialog('close');
                    }
                },
                data: JSON.stringify({ _id: _id, password: password })
            });
        };

        var onCancel = function (e) {
            $(this).dialog('close');
        };

        var onClose = function (e) {
            $(this).removeData('_id').find('#confirmPassword').val('');
        };

        return password_confirm_dialog.dialog({
            title: '确认密码',
            modal: true,
            autoOpen: false,
            close: onClose,
            width: 400,
            buttons: [
                {
                    text: "确定",
                    click: onOK
                },
                {
                    text: "取消",
                    click: onCancel
                }
            ]
        });
    }

    function showConfirmPasswordDialog(_id, callback) {

        if (login_user) {
            return callback();
        }

        if (!passwordConfirmDialog) {
            passwordConfirmDialog = createPasswordConfirmDialog();
            passwordConfirmDialog.on('verified', function () {
                passwordConfirmDialogCallback();
            });
        }
        passwordConfirmDialog.data('_id', _id);
        passwordConfirmDialogCallback = callback;
        passwordConfirmDialog.dialog('open');
    }

    function showReadOnlyBubble(e) {

        e.preventDefault();
        e.stopPropagation();
        var self = $(e.target);
        var bubble = $('#calendar_bubble_read_only');
        var div = $(e.target).parents('div.chip-normal');
        if (!div.length) {
            div = $(e.target);
        }
        var offset = div.offset();
        var x = offset.left;
        var y = offset.top - 320;
        var docx = $(document).width();
        var min_height = $('.m-meeting-search-area').outerHeight() + 45;
        if (x + 420 > docx) {
            x = docx - 420;
            $('[id="read:prong:3"]').hide();
            if (y < min_height) {
                y = min_height;
            }
        } else if (y < min_height) {
            y = min_height;
            $('[id="read:prong:3"]').hide();
        } else {
            $('[id="read:prong:3"]').show();
        }

        $('[id="read:w.when"]', bubble).text($.trim($('span.mt-label-time', div).text()));
        $('[id="readtitle"]', bubble).text($.trim($('span.mt-title', div).text()));
        $('[id="readdepartment"]', bubble).text($.trim($('span.mt-department', div).text()));
        $('[id="readusername"]', bubble).text($.trim($('span.mt-name', div).text()));
        $('[id="readphone"]', bubble).text($.trim($('span.mt-phone', div).text()));
        $('[id="readequipments"]', bubble).text($.trim($('span.mt-equipments', div).text()));
        $('[id="readmeetingRoom"]', bubble).text(div.parents('td').attr('room'));
        bubble.css({
            'display': 'block',
            'left': x,
            'top': y
        });

        if (login_user && $.trim(div.find('input.mt-scope').val()) === 0) {
            bubble.find('#comment-meeting')
                .data('_id', self.data('_id'))
                .unbind('click')
                .bind('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var comment_bt = $(this);
                    var _id = comment_bt.data('_id');

                    $.ajax({
                        url: './comment',
                        success: function (data) {
                            if (data.error) {
                                alert('差评出错');
                            } else {
                                comment_bt.hide();
                                bubble.hide();
                                alert('已差评');
                            }
                        },
                        data: JSON.stringify({ _id: _id })
                    });
                }).show();
        } else {
            bubble.find('#comment-meeting').hide();
        }

        bubble.find('#delete-meeting')
            .data('_id', self.data('_id'))
            .unbind('click')
            .bind('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var _id = $(this).data('_id');
                showConfirmPasswordDialog(_id, function () {
                    $.ajax({
                        url: './delete',
                        success: function (data) {
                            if (data.error) {
                                alert('删除会议出错');
                            }
                        },
                        data: JSON.stringify({ _id: _id, date: CONFIG.date })
                    });
                });
                bubble.hide();
            });
        bubble.find('#update-meeting')
            .data('_id', self.data('_id'))
            .unbind('click')
            .bind('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var _id = $(this).data('_id');
                showConfirmPasswordDialog(_id, function () {
                    showMeetingDialog(_id);
                });
                bubble.hide();
            });
    }

    function createMeetingDiv(meeting) {

        if (!$('td[room="' + meeting.room + '"] div.tg-gutter').length) {
            return;
        }
        var startTime = meeting.startTime;
        var startTimeArray = startTime.split(':');
        var startHour = parseInt(startTimeArray[0], 10);
        var startMinute = parseInt(startTimeArray[1], 10);
        var endTime = meeting.endTime;
        var endTimeArray = endTime.split(':');
        var endHour = parseInt(endTimeArray[0], 10);
        var endMinute = parseInt(endTimeArray[1], 10);

        meeting.height = CONFIG.cell_height * (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60 - 5;
        __meetings.push(meeting);
        var el = $('<div id="' + meeting._id + '" class="chip chip-normal" style="top: ' + (CONFIG.cell_height * startHour + CONFIG.cell_height * startMinute / 60 + 1) + 'px; left: 0%; width: 100%;"></div>')
            .html(new EJS({ url: '/templates/meeting-div.ejs' }).render(meeting))
            .data('_id', meeting._id)
            .appendTo($('td[room="' + meeting.room + '"] div.tg-gutter')[0]);

        if (!$.browser.msie || parseInt($.browser.version, 10) > 7) {
            var time = el.find('.mt-label-time').text();
            var title = el.find('.mt-title').text();
            var content = new EJS({ url: '/templates/meeting-popover.ejs' }).render(meeting);
            var left = el.offset().left;
            var width = el.width();
            var placement = 'right';
            //if ((280 - width) / 2 > left) {
            //    placement = 'right';
            //}
            if (280 + left + width > $('table.tg-timedevents').width()) {
                placement = 'left';
            }
            el.gmpopover({
                title: time + ' ' + title,
                content: content,
                placement: 'in ' + placement,
                _id: meeting._id,
                click: function (e) {
                    e.preventDefault();

                    var self = this;
                    var _id = this.options._id;
                    var target = $(e.target);

                    if (target.hasClass('btn-warning')) {
                        if (login_user) {
                            $.ajax({
                                url: './comment',
                                success: function (data) {
                                    if (data.error) {
                                        alert('差评出错');
                                    } else {
                                        self.hide();
                                        alert('已差评');
                                    }
                                },
                                data: JSON.stringify({ _id: _id })
                            });
                        }
                    } else if (target.hasClass('btn-danger')) {
                        showConfirmPasswordDialog(_id, function () {
                            $.ajax({
                                url: './delete',
                                success: function (data) {
                                    if (data.error) {
                                        alert('删除会议出错');
                                    }
                                },
                                data: JSON.stringify({ _id: _id, date: CONFIG.date })
                            });
                        });
                        self.hide();
                    } else if (target.hasClass('btn-primary')) {
                        showConfirmPasswordDialog(_id, function () {
                            showMeetingDialog(_id);
                        });
                        self.hide();
                    }
                }
            });
        } else {
            el.click(showReadOnlyBubble);
        }
    }

    function getMeetingList() {

        $.ajax({
            url: './list',
            success: function (data) {
                var i;
                if (data.error) {
                    alert('错误');
                } else {
                    for (i = 0; i < data.length; i += 1) {
                        createMeetingDiv(data[i]);
                    }
                }
            },
            data: JSON.stringify({ date: CONFIG.date })
        });
    }

    function getDepartmentList() {

        $.ajax({
            url: './departments',
            type: 'GET',
            success: function (data) {
                var i;
                if (data.error) {
                    alert('密码错误');
                } else {
                    __departments = data;
                }
            }
        });
    }

    function getPublicNoticeList() {

        $.ajax({
            url: './public-notices',
            type: 'GET',
            success: function (data) {
                new EJS({ url: '/templates/public-notice-list.ejs' }).update('public-notice', data);
                if (!$.browser.msie || parseInt($.browser.version, 10) > 7) {
                    var overlay = $("#view-notices a[rel]").overlay({ effect: 'apple', load: false });
                    //setTimeout(function () {
                    //    $('#view-notices a[rel]').overlay().close();
                    //}, 5000);
                    var carousel = $('#notice-carousel')
                        .width($('.m-meeting-search-area').width() - 650)
                        .css({
                            'position': 'absolute',
                            'margin-bottom': 0,
                            'top': 5,
                            'right': 0
                        });
                    var items = [];
                    var notice;
                    var notices = data.notices;
                    var i;
                    for (i = 0; i < notices.length; i += 1) {
                        notice = notices[i];
                        if (i === 0) {
                            items.push('<div class="active item">' + notice.content + '</div>');
                        } else {
                            items.push('<div class="item">' + notice.content + '</div>');
                        }
                    }
                    carousel.find('.carousel-inner').append(items.join(''));
                    $('.carousel').carousel({
                        interval: 5000
                    });
                } else {
                    $('#log-messages').removeClass('apple_overlay').show();
                    $('#view-notices').hide();
                }
            }
        });
    }

    function updateMeetingDiv(meeting) {

        var i;
        var div = $('#' + meeting._id);
        div.remove();
        createMeetingDiv(meeting);
        for (i = 0; i < __meetings.length; i += 1) {
            if (__meetings[i]._id === meeting._id) {
                __meetings.splice(i, 1, meeting);
                break;
            }
        }
    }

    function deleteMeetingDiv(meeting) {

        var i;
        $('#' + meeting._id).remove();
        for (i = 0; i < __meetings.length; i += 1) {
            if (__meetings[i]._id === meeting._id) {
                __meetings.splice(i, 1);
                break;
            }
        }
    }

    function updateMeetingComment(meeting) {

        var i;
        $('#' + meeting._id).find('input.mt-scope').val(meeting.scope);
        for (i = 0; i < __meetings.length; i += 1) {
            if (__meetings[i]._id === meeting._id) {
                __meetings[i].scope = meeting.scope;
                break;
            }
        }
    }

    function updateDepartments(departments) {
        __departments = departments;
    }

    var longPoll = (function () {

        var jsonRequest;
        var errorCount = 0;

        return function (data) {
            var message;
            var lastUpdateTime;
            var i;
            var timestamp;

            if (errorCount > 3) {
                $('#error-message').text('与服务器的连接已经断开，请刷新页面重新进入本页面。如果你经常遇到这种情况，请联系前台。');
                return;
            }

            //process any updates we may have
            //data will be null on the first call of longPoll
            if (data && data.length) {
                for (i = 0; i < data.length; i += 1) {
                    message = data[i];
                    timestamp = message.timestamp;
                    //track oldest message so we only request newer messages from server
                    if (timestamp > CONFIG.last_message_time) {
                        CONFIG.last_message_time = timestamp;
                    }
                    //dispatch new messages to their appropriate handlers
                    switch (message.type) {
                    case 'new-meeting':
                        createMeetingDiv(message.meeting);
                        break;
                    case "update-meeting":
                        updateMeetingDiv(message.meeting);
                        break;
                    case "delete-meeting":
                        deleteMeetingDiv(message.meeting);
                        break;
                    case "update-comment":
                        updateMeetingComment(message.meeting);
                        break;
                    case "select-departments":
                        updateDepartments(message.departments);
                        break;
                    }
                }
            }

            if (jsonRequest) {
                //errorCount -= 1;
                jsonRequest.abort();
            }
            jsonRequest = $.ajax({
                url: '/messages/recv',
                success: function (data) {
                    jsonRequest = null;
                    errorCount = 0;
                    longPoll(data);
                },
                error: function () {
                },
                complete: function (jqXHR, textStatus) {
                    jsonRequest = null;
                    if (textStatus === 'error' || textStatus === 'timeout') {
                        errorCount += 1;
                        setTimeout(longPoll, 1000);
                    }
                },
                data: JSON.stringify({ since: CONFIG.last_message_time, date: CONFIG.date })
            });
        };
    }());

    function resizeView() {

        var outer_height = window.innerHeight - $('.navbar').outerHeight() - $('.m-meeting-search-area').outerHeight() - $('.wk-weektop').outerHeight();
        $('#wk_scrolltimedevents').outerHeight(outer_height);
        CONFIG.table_height = $('#wk_scrolltimedevents').height();
        CONFIG.cell_height = Math.floor($('#wk_scrolltimedevents').height() / 10);
        if (CONFIG.cell_height % 2 === 1) {
            CONFIG.cell_height = CONFIG.cell_height - 1;
        }

        $('.tg-markercell').height(CONFIG.cell_height);
        $('.tg-dualmarker').height(CONFIG.cell_height / 2).css('margin-bottom', CONFIG.cell_height / 2);
        $('.tg-times-pri > div').height(CONFIG.cell_height);
        $('.tg-time-pri').height(CONFIG.cell_height - 1);
        $('.tg-col-eventwrapper').height(CONFIG.cell_height * 24);
        $('.tg-timedevents').height(CONFIG.cell_height * 24);
        $('div.chip-normal').each(function (i, div) {
            $(div).remove();
        });
        var old_meetings = __meetings;
        var old_meeting;
        var i;
        __meetings = [];
        for (i = 0; i < old_meetings.length; i += 1) {
            old_meeting = old_meetings[i];
            createMeetingDiv(old_meeting);
        }
        $('#wk_scrolltimedevents').scrollTop(CONFIG.cell_height * 8.5);
    }

    var resize_timer;

    if (!$.browser.msie || parseInt($.browser.version, 10) > 8) {
        resizeView();
    } else {
        $('#wk_scrolltimedevents').scrollTop(CONFIG.cell_height * 8.5);
    }
    $('#calendar_bubble_read_only').mousedown(function (e) {
        e.stopPropagation();
    });
    $('#select-date').val(CONFIG.date);
    $(".select-date").datepicker({
        dateFormat: 'yy-mm-dd',
        constrainInput: true,
        onSelect: function (dateText, inst) {
            CONFIG.date = dateText;
            CONFIG.last_message_time = new Date().getTime();
            $('div.chip-normal').each(function (i, div) {
                $(div).remove();
            });
            __meetings = [];
            getMeetingList();
            longPoll();
        }
    });

    $('#add-meeting').click(function (e) {
        e.preventDefault();
        if (!__departments) {
            return alert('缺少部门数据，请稍候再尝试！');
        }
        showMeetingDialog();
    });

    getMeetingList();
    getDepartmentList();
    getPublicNoticeList();

    longPoll();

    $(window).resize(function () {
        if (!$.browser.msie || parseInt($.browser.version, 10) > 8) {
            if (!resize_timer) {
                resize_timer = setTimeout(function () {
                    resizeView();
                    resize_timer = null;
                }, 300);
            }
        }
        $('#notice-carousel').width($('.m-meeting-search-area').width() - 650);
    });
});
