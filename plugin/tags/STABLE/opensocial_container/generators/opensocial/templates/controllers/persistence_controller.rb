class Feeds::PersistenceController < Feeds::BaseController
  # Persistence accross all instances and users of an application.
  def global
    @app = Feeds::App.find(params[:app_id])
    @persistence = Global.find(:all, :conditions => {:app_id => @app.id})
    
    respond_to do |format|
      format.xml
    end
  end
  
  # The friends feed
  def friends
  end
end