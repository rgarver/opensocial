require 'rexml/document'

module OpenSocialContainer
  class ContainerController < ActionController::Base
    self.prepend_view_path File.join(File.dirname(__FILE__), '..')
    session :session_key => "_myapp_session", :secret => "some secret phrase"
    
    def contain
      sig = Base64.decode64(params[:sig])
      (session[:owner_id], session[:viewer_id], session[:set_at]) = Marshal.restore(Base64.decode64(params[:sess]))
      raise "Invalid session(#{sig} != #{sign_opensocial_session(params[:sess])}) : #{session[:owner_id]} : #{session[:viewer_id]} : #{session[:set_at]}" unless sig == sign_opensocial_session(params[:sess])
      
      
      @owner = person_class.find(session[:owner_id])
      @viewer = person_class.find(session[:viewer_id])
      @app = Feeds::App.find_by_source_url(params[:src])
      @app.load_application!
    end
    
    def proxy
      resp = Net::HTTP.get_response(URI.parse(params[:src]))
      render :text => resp.body
    end
    
  private
    def person_class
      @person_class ||= OpenSocialContainer::Configuration.person_class.constantize
    end
  end
end