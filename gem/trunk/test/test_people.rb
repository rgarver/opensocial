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
  
  def test_get_someone_by_id
    get_req = Net::HTTP::Get.new('/feeds/people/14358878523263729569')
    Net::HTTP::Get.expects(:new).with('/feeds/people/14358878523263729569').returns(get_req)
    Net::HTTP.any_instance.expects(:use_ssl=).with(true)
    Net::HTTP.any_instance.expects(:request).with{|req| req['Authorization'] == @authorization}.
                  returns(fixture_as_httpresponse('person.xml'))
    person = @implementor.people.find('14358878523263729569')
    
    assert_equal 'http://sandbox.orkut.com:80/feeds/people/14358878523263729569', person.id
    assert_equal "Elizabeth Bennet", person.title
    assert_equal "http://img1.orkut.com/images/small/1193601584/115566312.jpg", person.thumbnail
  end
  
  def test_get_friends_for_me
    get_req = Net::HTTP::Get.new('/feeds/people/14358878523263729569/friends')
    Net::HTTP::Get.expects(:new).with('/feeds/people/14358878523263729569/friends').returns(get_req)
    Net::HTTP.any_instance.expects(:request).with{|req| req['Authorization'] == @authorization}.
                  returns(fixture_as_httpresponse('friends.xml'))
    person = OpenSocial::API::Person.new_from_xml(@implementor, File.read(File.join(File.dirname(__FILE__), 'fixtures', 'person.xml')))
    friends = person.friends
    
    assert_kind_of Array, friends
    assert_equal 3, friends.size
    
    friends_check_list = {"Jane Bennet" => '02938391851054991972', 
                          "Charlotte Lucas" => '12490088926525765025', 
                          "Fitzwilliam Darcy" => '15827776984733875930'}
    friends.each do |friend|
      assert friends_check_list.has_key?(friend.title)
      assert_equal "http://sandbox.orkut.com:80/feeds/people/#{friends_check_list[friend.title]}", friend.id
      friends_check_list.delete(friend.title)
    end
  end
end