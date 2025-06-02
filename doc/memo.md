# 备忘录

## 文档

[HTTP 响应状态码](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Status)

## 常用命令

### 合并分支

```shell
# 1. 切换到 master 分支
git checkout master

# 2. 拉取最新的远程 master
git pull origin master

# 3. 合并 base 分支到 master
git merge base

# 4. 解决冲突，然后提交合并

# 5. 推送合并后的 master 到远程
git push origin master
# 或 pnpm push
```

### 撤销提交

```shell
# 1. 仅撤销提交，保留改动
git reset --soft HEAD~1

# 2. 撤销提交+取消暂存
git reset --mixed HEAD~1

# 3. 完全回退提交 + 改动都消失
git reset --hard HEAD~1
```

### 取消对某文件的跟踪

1、如果是新增文件，从未提交过，在.gitignore文件中添加文件名，即可忽略该文件

2、如果是已经提交过，在步骤1的基础上，再执行`git rm --cached 文件名`，然后提交代码，即可忽略该文件

```shell
# 取消git对文件的跟踪
git rm --cached 文件名
```
