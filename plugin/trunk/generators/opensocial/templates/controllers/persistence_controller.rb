class Feeds::PersistenceController < Feeds::BaseController
  # Persistence accross all instances and users of an application.
  def global
    @app = Feeds::App.find(params[:id])
    @persistence = @app.persistence.globals
  end
  
  # The friends feed
  def friends
  end
end