module mooncl::pool;

use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::table::{Self, Table};

public struct ClaimKey has copy, drop, store {
    addr: address,
    epoch: u64,
}

public struct Pool has key{
  id: UID,
  balance: Balance<SUI>,
  cur_epoch: u64,
  cur_currency_amount: u64,
  deadline: u64,
  claim: Table<ClaimKey, u64>,
  is_claim: Table<ClaimKey, bool>
}

public struct PoolCap has key{
  id: UID
}

fun init(ctx: &mut TxContext){
  transfer::transfer(PoolCap{id: object::new(ctx)}, ctx.sender());
  transfer::share_object(Pool{
    id: object::new(ctx), 
    balance: balance::zero(),
    cur_epoch: 0,
    cur_currency_amount: 0,
    deadline: 0,
    claim: table::new<ClaimKey, u64>(ctx),
    is_claim: table::new<ClaimKey, bool>(ctx)
  });
}

public fun new_epoch(pool: &mut Pool, _:&PoolCap, amount: u64, clock: &Clock, deadline: u64){
  assert!(clock.timestamp_ms() > pool.deadline, 0);
  assert!(balance::value(&pool.balance) == 0, 1);
  pool.cur_epoch = pool.cur_epoch + 1;
  pool.cur_currency_amount = amount;
  pool.deadline = deadline;
}

public fun into_pool(pool: &mut Pool, ticket: Coin<SUI>, clock: &Clock){
  assert!(coin::value(&ticket) == pool.cur_currency_amount, 0);
  assert!(clock.timestamp_ms() < pool.deadline, 1);
  coin::put(&mut pool.balance, ticket);
}

public fun set_claim(_: &PoolCap, pool: &mut Pool, scores: vector<u64>, addrs: vector<address>){
  let table = &mut pool.claim;
  let epoch = pool.cur_epoch;
  let len = vector::length(&scores);
  assert!(len == vector::length(&addrs), 1);
  let mut i = 0;
  while (i < len) {
      let addr = *vector::borrow(&addrs, i);
      let score = *vector::borrow(&scores, i);
      let key = ClaimKey{
        addr,
        epoch
      };
      if(table::contains(table, key)){
        *(table::borrow_mut(table, key)) = score;
      }else{
        table::add(table, key, score);
      };
      i = i + 1;
  };
}

public fun out_pool(pool: &mut Pool, clock: &Clock, ctx: &mut TxContext): Coin<SUI>{
  let is_table = &mut pool.is_claim;
  let claim_table = &pool.claim;
  let key = ClaimKey{
    addr: ctx.sender(),
    epoch: pool.cur_epoch
  };
  assert!(clock.timestamp_ms() >= pool.deadline, 0);
  assert!(!table::contains(is_table, key), 1);
  let value = table::borrow(claim_table, key);
  let coin = coin::take(&mut pool.balance, *value, ctx);
  let key = ClaimKey{
    addr: ctx.sender(),
    epoch: pool.cur_epoch
  };
  table::add(is_table, key, true);
  coin
}

// read only functions
public fun get_cur_epoch(pool: &Pool): u64{
  pool.cur_epoch
}

public fun get_value(pool: &Pool, target: address, epoch: u64): u64{
  let table = &pool.claim;
  let key = ClaimKey{
    addr: target,
    epoch
  };
  *table::borrow(table, key)
}

public fun get_amount(pool: &Pool): u64{
  pool.cur_currency_amount
}

#[test_only]
public(package) fun test_init(ctx: &mut TxContext, deadline: u64, currency_amount: u64){
  init(ctx, deadline, currency_amount);
}