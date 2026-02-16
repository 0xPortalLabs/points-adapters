import type { AdapterExport } from "../utils/adapter.ts";
import { getAddress } from "viem";
import {
  convertValuesToNormal,
} from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";


const API_URL = "https://app.upshift.finance/api/proxy/points/total?wallet={address}"

export default {
    fetch: async(address:string) =>{
        const res = await fetch(API_URL.replace("{address}",getAddress(address)))
        console.log(res)
        return await res.json()
    },
    data:(data: {totalPoints:number}) => {
        return data
    },
    total:(data:{points: Record<string, { totalPoints: number }>})=> {
        return data.points["1"].totalPoints
    },
} as AdapterExport