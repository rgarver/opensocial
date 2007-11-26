require File.join(File.dirname(__FILE__), 'open_social_container', 'route_mapper')

module ActionView
  module Helpers
    
    # The OpenSocialConatainerHelper adds several helper functions in to the ActionView::Base
    # which support the inserting of an OpenSocial container into a rails application.
    module OpenSocialContainerHelper
      def opensocial_container(app_src, *opts)
        options = opts.last.is_a?(Hash) ? opts.last.symbolize_keys : {}
        app = app_src.is_a?(Feeds::App) ? app_src : Feeds::App.find_or_create_by_source_url(app_src)
        self.content_tag(:iframe, '', {:src => opensocial_container_url(app.source_url), 
                          :style => 'border:0px; padding:0px; margin:0px;', 
                          :width => (app.width || '320'), 
                          :height => (app.height || '200'), 
                          :scrolling => app.scrolling ? 'yes' : 'no '}.merge(options))
      end
    end
  end
end

ActionView::Base.send :include, ActionView::Helpers::OpenSocialContainerHelper