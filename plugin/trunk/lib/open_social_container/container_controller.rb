require 'rexml/document'

module OpenSocialContainer
  class ContainerController < ApplicationController
    self.prepend_view_path File.join(File.dirname(__FILE__), '..')
    session :session_key => "_myapp_session", :secret => "some secret phrase"
    
    def contain
      @app = Feeds::App.find_by_source_url(params[:src])
      @app.load_application!
    end
    
    def proxy
      resp = Net::HTTP.get_response(URI.parse(params[:src]))
      render :text => resp.body
    end
  end
end