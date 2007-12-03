require File.join(File.dirname(__FILE__), 'open_social_container', 'route_mapper')
require File.join(File.dirname(__FILE__), 'open_social_container', 'configurator')

module ActionView
  module Helpers
    
    # The OpenSocialConatainerHelper adds several helper functions in to the ActionView::Base
    # which support the inserting of an OpenSocial container into a rails application.
    module OpenSocialContainerHelper
      def opensocial_container(app_src, *opts)
        options = opts.last.is_a?(Hash) ? opts.last.symbolize_keys : {}
        app = app_src.is_a?(Feeds::App) ? app_src : Feeds::App.find_or_create_by_source_url(app_src)
        self.content_tag(:iframe, '', {:src => opensocial_container_url(app.source_url, options.delete(:owner), options.delete(:viewer)), 
                          :style => 'border:0px; padding:0px; margin:0px;', 
                          :width => (app.width || '320'), 
                          :height => (app.height || '200'), 
                          :scrolling => app.scrolling ? 'yes' : 'no '}.merge(options))
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