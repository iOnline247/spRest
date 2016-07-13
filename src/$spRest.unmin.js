/*global 
    _spPageContextInfo 
    _spFormDigestRefreshInterval 
    ExecuteOrDelayUntilScriptLoaded
    UpdateFormDigest
    jQuery
*/

/*!
 * Created by Matthew Bramer
 * Released under the MIT license
 * Date: 2016-07-11
 * Props to: http://blogs.msmvps.com/windsor/2015/02/13/reduce-code-need-for-rest-api-calls-with-sprestrepository/
 * Tested using SharePoint Online.
 */

// http://sharepoint.stackexchange.com/questions/74978/can-i-tell-what-version-of-sharepoint-is-being-used-from-javascript

(function ($) {
    'use strict';

    window.$sp = window.$sp || function (appUrl, hostUrl) {
        var _formDigest;
        var _odataType = 'nometadata';

        appUrl = appUrl || _spPageContextInfo.webAbsoluteUrl;

        function getOdataHeader () {
            return 'application/json;odata=' + _odataType;
        }

        function checkFormDigest (formDigest) {
            if (!formDigest) {
                formDigest = _formDigest;
            }
            
            return formDigest;
        }

        function buildUrl (url) {
            url = appUrl + (url.charAt(0) === '/') ? url : '/' + url;

            if (hostUrl) {
                var api = '_api/';
                var index = url.indexOf(api);
                url = url.slice(0, index + api.length) +
                    'SP.AppContextSite(@target)' +
                    url.slice(index + api.length - 1);

                var connector = '?';
                if (url.indexOf('?') > -1 && url.indexOf('$') > -1) {
                    connector = '&';
                }

                url = url + connector + '@target=\'' + hostUrl + '\'';
            }

            return url;
        }

        function getFormDigest () {
            return _formDigest;
        }

        function setFormDigest (formDigest) {
            // Update form digest prior to setting it.
            // Should only update, if formDigest isn't passed in.
            // That should allow for other webs/sites to be used.
            if (!formDigest) {
                ExecuteOrDelayUntilScriptLoaded(function() {
                    UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
                }, 'sp.js');
            }
            _formDigest = formDigest || document.getElementById('__REQUESTDIGEST').value;
        }

        function getOdataType () {
            return _odataType;
        }

        function setOdataType (odataType) {
            _odataType = odataType;
        }

        function get (options) {
            if (typeof options === 'string') {
                var temp = options;

                options = {};
                options.url = temp;
            }

            var opt = $.extend({}, {
                odataHeader: getOdataHeader()
            }, options);

            return $.ajax({
                url: buildUrl(opt.url),
                type: 'GET',
                dataType: 'json',
                headers: {
                    'Accept': opt.odataHeader
                }
            });
        }

        function add (options) {
            var opt = $.extend(true, {}, {
                data: {
                    '__metadata': {
                        type: 'SP.Data.{0}ListItem'
                    }
                },
                formDigest: checkFormDigest(options.formDigest)
            }, options);

            if (typeof opt.data !== 'string') {
                var rfindListName = /\('(.+)'\)/i;
                var listName = opt.url.match(rfindListName)[1];

                opt.data['__metadata'].type = opt.data['__metadata'].type.replace('{0}', listName);
                opt.data = JSON.stringify(opt.data);
            }

            // Fails when 'nometadata' is used.
            opt.odataHeader = 'application/json;odata=verbose';

            return $.ajax({
                url: buildUrl(opt.url),
                type: 'POST',
                data: opt.data,
                headers: {
                    'Accept': opt.odataHeader,
                    'Content-Type': opt.odataHeader,
                    'X-RequestDigest': opt.formDigest
                }
            });
        }

        function update (options) {
            var opt = $.extend(true, {}, {
                data: {
                    '__metadata': {
                        type: 'SP.Data.{0}ListItem'
                    }
                },
                etag: '*',
                formDigest: checkFormDigest(options.formDigest),
                httpMethod: 'PATCH'
            }, options);

            if (typeof opt.data !== 'string') {
                var rfindListName = /\('(.+)'\)/i;
                var listName = opt.url.match(rfindListName)[1];

                opt.data['__metadata'].type = opt.data['__metadata'].type.replace('{0}', listName);
                opt.data = JSON.stringify(opt.data);
            }

            // Fails when 'nometadata' is used.
            opt.odataHeader = 'application/json;odata=verbose';

            return $.ajax({
                url: buildUrl(opt.url),
                type: 'POST',
                data: opt.data,
                headers: {
                    'Accept': opt.odataHeader,
                    'Content-Type': opt.odataHeader,
                    'X-RequestDigest': opt.formDigest,
                    'IF-MATCH': opt.etag,
                    'X-Http-Method': opt.httpMethod
                }
            });
        }

        function doDelete (options) {
            if (typeof options === 'string') {
                var temp = options;

                options = {};
                options.url = temp;
            }

            var opt = $.extend({}, {
                odataHeader: getOdataHeader(),
                formDigest: checkFormDigest(options.formDigest),
                etag: '*'
            }, options);

            return $.ajax({
                url: buildUrl(opt.url),
                type: 'DELETE',
                headers: {
                    'Accept': opt.odataHeader,
                    'X-RequestDigest': opt.formDigest,
                    'IF-MATCH': opt.etag
                }
            });
        }

        function failHandler (jqXHR) {
            var response,
                log = (window.console) ? console.log : alert
            ;

            try {
                var parsed = JSON.parse(jqXHR.responseText);
                response = parsed.error.message.value;
            } catch (e) {
                response = jqXHR.responseText;
            }
            
            log('Call failed. Error: ' + response);
        }

        function SPRest () {
            this.set_formDigest();
        }

        SPRest.prototype = {
            get_formDigest: getFormDigest,
            set_formDigest: setFormDigest,
            get_odataType: getOdataType,
            set_odataType: setOdataType,
            get: get,
            add: add,
            update: update,
            'delete': doDelete,
            failHandler: failHandler
        };

        return new SPRest();
    };
}(jQuery));