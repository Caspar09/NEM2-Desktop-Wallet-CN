<template>
  <div class="network_content">

    <div class="right_set_point left">
      <ul>
        <li>
          Network Name
          <div class="gray_content">
            <input class="absolute" type="text" :placeholder="currentPoint.name">
          </div>
        </li>
        <li>
          New RPC URL
          <div class="gray_content">
            <input class="absolute" type="text" :placeholder="currentPoint.rpcUrl">
          </div>
        </li>
        <li>
          ChainID(optional)
          <div class="gray_content">
            <input class="absolute" type="text" :placeholder="currentPoint.chainId">
          </div>
        </li>
        <li>
          Symbol(optional)
          <div class="gray_content">
            <input class="absolute" type="text" :placeholder="currentPoint.symbol">
          </div>
        </li>
        <li>
          Block Explorer URL（optional）
          <div class="gray_content">
            <input class="absolute" type="text" :placeholder="currentPoint.exploerUrl">
          </div>
        </li>
      </ul>
      <div class="bottom_button">
        <!--        //TODO-->
        <span class="save_button un_click">{{$t('save')}}</span>
        <span class="cancel_button pointer">{{$t('canel')}}</span>
      </div>
    </div>

    <div class="left_point_list left">
      <ul>
        <li class="create_node pointer"><img src="@/common/img/setting/settingCreateNode.png" alt="">{{$t('create_node')}}
        </li>
        <li @click="selectPoint(index)" v-for="(p,index) in pointList"
            :class="['green_point',' pointer',pointerColorList[index%4],p.isSelected?'selected_point':'']">
          {{p.name}}
          <span v-if="index !== 0"></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
    import {SettingNetworkTs} from './SettingNetworkTs'

    export default class SettingNetwork extends SettingNetworkTs {

    }
</script>
<style scoped lang="less">
  @import "SettingNetwork.less";
</style>
