/*jslint vars: true, nomen: true */
/*global window, document, $, EJS, login_user, alert */

$(function () {
    'use strict';

    var submiting = false;

    var onOK = function () {
        if (submiting) {
            return;
        }
        var dialog = $(this);
        var name = dialog.find('#name').val();
        var enabled = dialog.find('#enabled').attr('checked');
        if ($.trim(name) === '') {
            alert('请填写会议室名称');
            return;
        }
        $.ajax({
            url: './insert',
            success: function (data) {
                if (data.error) {
                    alert('添加会议室出错');
                } else {
                    window.location.reload();
                }
            },
            complete: function () {
                submiting = false;
            },
            data: JSON.stringify({name: name, enabled: enabled})
        });
    };

    var onCancel = function () {
        $(this).dialog('close');
    };

    var onClose = function() {
        var dialog = $(this);
        dialog.find('#name').val('');
        dialog.find('#enabled').attr('checked', true);
    };

    var rooms_dialog = $('#rooms-dialog')
        .append(new EJS({ url: '/templates/meeting-room-dialog.ejs' }).render())
        .dialog({
            title: '添加会议室',
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

    $('#add-meeting-room').click(function (e) {
        e.preventDefault();
        rooms_dialog.dialog('open');
    });

    $('.disabled-meeting-room').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: './change-state',
            success: function (data) {
                if (data.error) {
                    alert('禁用会议室出错');
                } else {
                    window.location.reload();
                }
            },
            data: JSON.stringify({ _id: $(this).attr('id'), enabled: false})
        });

    });
    $('.enabled-meeting-room').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: './change-state',
            success: function (data) {
                if (data.error) {
                    alert('启用会议室出错');
                } else {
                    window.location.reload();
                }
            },
            data: JSON.stringify({ _id: $(this).attr('id'), enabled: true })
        });

    });
    $('.delete-meeting-room').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: './delete',
            success: function (data) {
                if (data.error) {
                    alert('删除会议室出错');
                } else {
                    window.location.reload();
                }
            },
            data: JSON.stringify({ _id: $(this).attr('id') })
        });
    });
});