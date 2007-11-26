require 'action_controller/routing'
require File.join(File.dirname(__FILE__), 'route_ext')
require File.join(File.dirname(__FILE__), 'container_controller')

module OpenSocialContainer
  module RouteMapper
    def opensocial_container(subdomain)
      ::ActionController::Base.send(:define_method, :opensocial_container_url) do |src|
        "http://#{subdomain}.#{request.host}:#{request.port}/container?src=#{URI.encode(src)}"
      end
      ::ActionController::Base.send(:define_method, :opensocial_container_proxy_url) do
        "http://#{subdomain}.#{request.host}:#{request.port}/proxy"
      end
      ::ActionController::Base.send(:define_method, :opensocial_container_proxy_path) do
        "/proxy"
      end
      ::ActionController::Base.send :helper_method, :opensocial_container_url, :opensocial_container_proxy_url, :opensocial_container_proxy_path
      
      @set.add_route('/container', 
                          {:controller => 'open_social_container/container', 
                          :action => 'contain', 
                          :conditions => {:subdomain => subdomain.to_s}})
      @set.add_route('/proxy', 
                          {:controller => 'open_social_container/container', 
                          :action => 'proxy', 
                          :conditions => {:subdomain => subdomain.to_s}})
    end
  end
end

ActionController::Routing::RouteSet::Mapper.send :include, OpenSocialContainer::RouteMapper