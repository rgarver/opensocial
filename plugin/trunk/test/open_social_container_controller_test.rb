require File.join(File.dirname(__FILE__), 'test_helper')
require File.join(File.dirname(__FILE__), 'fixtures', 'application_controller')
require 'open_social_container/container_controller'

module OpenSocialContainer
  class ContainerController; def rescue_action(e) raise e end; end
end

class OpenSocialContainerControllerTest < Test::Unit::TestCase
  def setup
    @controller = OpenSocialContainer::ContainerController.new
    @request    = ActionController::TestRequest.new
    @response   = ActionController::TestResponse.new
  end
  
  # Replace this with your real tests.
  def test_contain_without_signature
    get 'contain'
    assert_response :success
    assert @response.body.blank?
  end
  
  def test_contain_with_signature
    info = Base64.encode64(Marshal.dump([1,
            2,
            3,
            4,
            Time.now]))
    owner = stub(:id => 1, :title => 'Owner', :email => 'owner')
    owner.class.stubs(:opensocial_id_column_name).returns('id')
    viewer = stub(:id => 2, :title => 'Viewer', :email => 'viewer')
    viewer.class.stubs(:opensocial_id_column_name).returns('id')
    User.expects(:find).with(1).returns(owner)
    User.expects(:find).with(2).returns(viewer)
    app = stub(:id => 4, :load_application! => true, :title => 'App', :user_preferences => '', :content => '')
    Feeds::App.expects(:find).with(4).returns(app)
    
    get 'contain', :sess => info, :sig => Base64.encode64(@controller.send(:sign_opensocial_session, info))
    assert_response :success
    assert_equal owner, assigns(:owner)
    assert_equal viewer, assigns(:viewer)
    assert_equal app, assigns(:app)
    assert_equal 3, assigns(:instance_id)
  end
  
  def test_proxy
    Net::HTTP.expects(:get_response).with(URI.parse('http://localhost/test')).
                  returns(stub(:body => 'Result', :code => '200'))
    get 'proxy', :src => URI.encode("http://localhost/test")
    assert_response :success
    assert_equal 'Result', @response.body
  end
end
