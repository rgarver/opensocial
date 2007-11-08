require File.dirname(__FILE__) + '/test_helper.rb'

class TestPeople < Test::Unit::TestCase
  def setup
    @url = 'https://orkut.com/feeds/'
    @implementor = OpenSocial::API::Implementor.new(@url)
    @implementor.token = @token = 'token'
    @implementor.authorization = @authorization = 'GoogleLogin auth=#{@token}'
  end
  
  def test_get_me
    get_req = Net::HTTP::Get.new('/feeds/people/me')
    Net::HTTP::Get.expects(:new).with('/feeds/people/me').returns(get_req)
    Net::HTTP.any_instance.expects(:use_ssl=).with(true)
    Net::HTTP.any_instance.expects(:request).with{|req| req['Authorization'] == @authorization}.
                  returns(fixture_as_httpresponse('person.xml'))
    myself = @implementor.people.find(:me)
    
    assert_equal 'http://sandbox.orkut.com:80/feeds/people/14358878523263729569', myself.id
    assert_equal "Elizabeth Bennet", myself.title
    assert_equal "http://img1.orkut.com/images/small/1193601584/115566312.jpg", myself.thumbnail
  end
end