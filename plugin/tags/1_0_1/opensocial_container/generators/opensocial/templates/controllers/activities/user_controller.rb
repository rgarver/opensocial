class Feeds::Activities::UserController < Feeds::BaseController
  before_filter :person_in_context
  
  def show
    @activities = @person.activities
    
    respond_to do |format|
      format.xml
    end
  end
end