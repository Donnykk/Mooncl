module mooncl::bottle;

use sui::event;
use mooncl::pool::{Self, Pool};
use sui::clock::Clock;
use std::string::String;
use sui::coin::Coin;
use sui::sui::SUI;

// struct
public struct Bottle has key{
  id: UID,
  owner: address,
  content: String,
  created_at: u64,
  epoch: u64
}

// events
public struct BottleEvent has store, copy, drop{
  id: ID,
  owner: address
}

// functions
public entry fun send_bottle(content: String, clock: &Clock, pool: &mut Pool,
ticket: Coin<SUI>, ctx: &mut TxContext){
  pool::into_pool(pool, ticket, clock);
  let epoch = pool::get_cur_epoch(pool);
  let bottle = Bottle{
    id: object::new(ctx),
    owner: ctx.sender(),
    content,
    created_at: clock.timestamp_ms(),
    epoch
  };
  let id = bottle.id.to_inner();
    event::emit(BottleEvent{
    id,
    owner: bottle.owner
  });
  transfer::transfer(bottle, ctx.sender());
}
