$:.unshift(File.join(File.dirname(__FILE__), 'open_social_container'))
require File.join(File.dirname(__FILE__), 'open_social_container', 'route_mapper')
require File.join(File.dirname(__FILE__), 'open_social_container', 'configurator')

module ActionView
  module Helpers
    
    # The OpenSocialConatainerHelper adds several helper functions in to the ActionView::Base
    # which support the inserting of an OpenSocial container into a rails application.
    module OpenSocialContainerHelper
      def opensocial_container(app_src, *opts)
        options = opts.last.is_a?(Hash) ? opts.last.symbolize_keys : {}
        frame_id = "opensocial_container_#{options[:instance_id].to_s.underscore}"
        app = app_src.is_a?(Feeds::App) ? app_src : Feeds::App.find_by_source_url(app_src)
        self.content_tag(:iframe, '', {:src => opensocial_container_url(app, options.delete(:owner), options.delete(:viewer), options.delete(:instance_id)),
                          :id => frame_id, :name => frame_id,
                          :style => 'border:0px; padding:0px; margin:0px;', 
                          :width => (app.width || '320'), 
                          :height => (app.height || '200'), 
                          :scrolling => app.scrolling ? 'yes' : 'no '}.merge(options)) +
        self.content_tag(:script, '
        /**
        *
        * Base64 encode / decode
        * http://www.webtoolkit.info/
        *
        **/

        var Base64 = {

            // private property
            _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

            // public method for encoding
            encode : function (input) {
                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;

                input = Base64._utf8_encode(input);

                while (i < input.length) {

                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                    this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                    this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

                }

                return output;
            },

            // public method for decoding
            decode : function (input) {
                var output = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;

                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                while (i < input.length) {

                    enc1 = this._keyStr.indexOf(input.charAt(i++));
                    enc2 = this._keyStr.indexOf(input.charAt(i++));
                    enc3 = this._keyStr.indexOf(input.charAt(i++));
                    enc4 = this._keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                }

                output = Base64._utf8_decode(output);

                return output;

            },

            // private method for UTF-8 encoding
            _utf8_encode : function (string) {
                string = string.replace(/\r\n/g,"\n");
                var utftext = "";

                for (var n = 0; n < string.length; n++) {

                    var c = string.charCodeAt(n);

                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    }
                    else if((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }

                }

                return utftext;
            },

            // private method for UTF-8 decoding
            _utf8_decode : function (utftext) {
                var string = "";
                var i = 0;
                var c = c1 = c2 = 0;

                while ( i < utftext.length ) {

                    c = utftext.charCodeAt(i);

                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i+1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else {
                        c2 = utftext.charCodeAt(i+1);
                        c3 = utftext.charCodeAt(i+2);
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }

                }

                return string;
            }

        }

        window.setTimeout(function(){window.setInterval(function() {
          var frame = null;
        	var innerFrame = null;
        	var current_frame_id = "'+frame_id+'";
      	  if(window.comm_last_seq == undefined){
      	    window.comm_last_seq = {};
      	  }
      	  if(window.comm_last_seq[current_frame_id] == undefined) {
      	    comm_last_seq[current_frame_id] = 0;
      	  }
        	frame = window.frames[current_frame_id];
        	if (frame) {
        		innerFrame = frame.frames[0];
        		if (innerFrame) {
        		  try {
          			var loc = innerFrame.location;
          			//console.log("InnerFrame location = "+loc.href);
          			var frag = loc.hash.substr(1);
          			var seqnum = frag.split("!")[0];
          			var data = frag.split("!")[1];
          			//console.log("SeqNum: "+seqnum+",  Data="+data);
          			if (data.length > 0 && seqnum != window.comm_last_seq[current_frame_id])
          			{
          				window.comm_last_seq[current_frame_id] = seqnum;
          				var decoded_data = Base64.decode(data).split(" ");
          				console.log("Running: "+decoded_data[0] + ": " + decoded_data[1]);
          				if(decoded_data[0] == "resize") {
          				  document.getElementById(current_frame_id).height = decoded_data[1];
          				}
          			}
        			} catch(e) {}
        		}
        	}
        }, 1000);}, 2000);
        ', :type => 'text/javascript')
      end
    end
  end
end

module OpenSocialContainer
  module SessionSigning
    def self.included(base)
      base.send :helper_method, :sign_opensocial_session
    end
    
    def sign_opensocial_session(sess)
      Digest::MD5.digest("#{OpenSocialContainer::Configuration.secret}--#{sess}")
    end
  end
  
  module ActsAsOpenSocialPerson
    def self.included(base)
      base.send :include, OpenSocialContainer::ActsAsOpenSocialPerson::InstanceMethods
      base.send :extend, OpenSocialContainer::ActsAsOpenSocialPerson::ClassMethods
    end
    
    module InstanceMethods
    end
    
    module ClassMethods
      # Informs the opensocial_container plugin how to route requests for /feeds/people requests.
      # This function take several options
      # * <tt>:map</tt>: A hash that contains name mappings 
      def acts_as_opensocial_person(opts = {})
        OpenSocialContainer::Configuration.person_class = self.name
      end
    end
  end
end

ActionView::Base.send :include, ActionView::Helpers::OpenSocialContainerHelper
ActionController::Base.send :include, OpenSocialContainer::SessionSigning
ActiveRecord::Base.send :include, OpenSocialContainer::ActsAsOpenSocialPerson