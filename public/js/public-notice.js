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
        var content = dialog.find('#content').val();
        var _id = dialog.data('_id');

        if ($.trim(content) === '') {
            alert('请填写公告内容');
            return;
        }
        $.ajax({
            url: _id ? './update' : './insert',
            success: function (data) {
                if (data.error) {
                    if (data.message) {
                        alert(data.message);
                        return;
                    }
                    alert(_id ? '修改公告出错' : '添加公告出错');
                } else {
                    window.location.reload();
                }
            },
            complete: function () {
                submiting = false;
            },
            data: JSON.stringify({ _id: _id, content: content })
        });
    };

    var onCancel = function () {
        $(this).dialog('close');
    };

    var onClose = function () {
        $(this).removeData('_id').find('#content').val('');
    };

    var notice_dialog = $('#notice-dialog')
        .append('<label for="content">公告内容： </label><textarea id="content" style="width: 350px;"></textarea>')
        .dialog({
            autoOpen: false,
            modal: true,
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

    $('#add-notice').click(function (e) {
        e.preventDefault();
        notice_dialog.dialog('option', { title: '添加公告' }).dialog('open');
    });
    $('.edit-notice').click(function (e) {
        e.preventDefault();
        notice_dialog.data('_id', $(this).attr('_id'));
        notice_dialog.find('#content').val($.trim($(this).parent().next().html()).replace(/<br\s*\/?>/ig, '\n'));
        notice_dialog.dialog('option', { title: '修改公告' }).dialog('open');
    });
    $('.delete-notice').click(function (e) {
        e.preventDefault();
        $.ajax({
            url: './delete',
            success: function (data) {
                if (data.error) {
                    if (data.message) {
                        alert(data.message);
                        return;
                    }
                    alert('删除公告出错');
                } else {
                    window.location.reload();
                }
            },
            data: JSON.stringify({ _id: $(this).attr('_id') })
        });
    });
});