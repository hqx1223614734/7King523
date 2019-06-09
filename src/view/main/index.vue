<template>
  <div class="main">
    <Modal v-model="nameModal" width="360" :mask-closable="false" :closable="false">
      <p slot="header" style="color:#f60;text-align:center">
          请输入昵称
      </p>
      <div style="text-align:center">
        <Input v-model="name" />
      </div>
      <div slot="footer">
        <Button type="primary" size="large" long @click="handleAddName">确定</Button>
      </div>
    </Modal>
    <router-view></router-view>
  </div>
</template>
<script>
import md5 from 'md5'
import UCommon from '@/util/common'
export default {
  name: '',
  props: [],
  components: {},
  data () {
    return {
      nameModal: false,
      name: ''
    }
  },
  created () {},
  mounted () {
    let SingleToken = UCommon.getUserMsg()
    if (SingleToken === null) {
      this.nameModal = true
    } else {
    }
  },
  methods: {
    handleAddName () {
      let name = this.name.trim()
      if (name.length === 0) {
        this.$Message.error('不能是空')
      } else if (name.length > 16) {
        this.$Message.error('不能大于16个字符')
      } else {
        UCommon.setUserMsg(name, md5(name + new Date()))
        this.nameModal = false
      }
    }
  },
  computed: {
  }
}
</script>
<style scoped>
.main {
  width:100%;
  height:100%;
}
</style>
