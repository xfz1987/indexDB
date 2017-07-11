# indexDB 插件使用说明
## 背景
> W3C已经不再维护websql，经测试，发现现有的移动产品中，iphone6S、iphone6 plus已不再支持websql了，可想而知，iphone7及将要面世的iphone8都不会再支持websql，而将会支持indexDB，而对于有些移动设备对indexDB支持的不是很好，所以在实际开发中，应该做websql与indexDB的兼容处理。
## websql与indexDB的比较
> w3c之所以不再维护websql，是因为websql的使用，尤其是操作数据库语句与后端数据库MySQL神似，是关系型数据库（表与表之间有关系连接，如图），他可以解决复杂逻辑关系存储，支持复杂语句的查询及更新
  user(用户表)                        dept(部门表)
 userId	用户ID                       deptId	部门号
 name	姓名                      |--- name		名称
 deptId	部门号 -----------------
> 如图所示，user表的deptId与dept表的deptId是一样的，这样两个表就建立的关系。下面看看数据就知道了
> ndexDB是一种对象型存储数据库，更适用于简单的内容存储，无法解决逻辑关系存储，操作看似简单，实则很麻烦，因为不存在关系，因此无法像websql那样一条语句就可以解决多表间复杂的查询，应用于简单的单表查询，这样反而更容易被前端小伙伴们理解，
