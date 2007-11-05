require File.dirname(__FILE__) + '/test_helper.rb'

class TestPeople < Test::Unit::TestCase
  def setup
    @url = 'https://orkut.com/feeds/'
    @implementor = OpenSocial::API::Implementor.new(@url)
    @implementor.token = 'token'
    @implementor.login_method = 'GoogleLogin'
  end
  
  def test_get_me
    Net::HTTP.any_instance.expects(:request_get).with('/feeds/people/me').returns(fixture_as_httpresponse('person.xml'))
    myself = @implementor.people.find(:me)
    
    assert_equal 'http://sandbox.orkut.com:80/feeds/people/14358878523263729569', myself.id
    assert_equal "Elizabeth Bennet", myself.title
    assert_equal "http://img1.orkut.com/images/small/1193601584/115566312.jpg", myself.thumbnail
  end
end